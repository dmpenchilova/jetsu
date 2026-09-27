/**
 * Двухфакторный вход (TOTP — Google Authenticator, Яндекс Ключ, 1Password и т. п.).
 *
 * Как устроено:
 *  - пользователь включает 2FA сам: «Мой профиль» → «Двухфакторный вход» → сканирует QR → вводит код;
 *  - при входе под формой логина есть поле «Код из приложения»; код уходит вместе с логином
 *    (через короткоживущую cookie), хук beforeLogin проверяет его;
 *  - вместо кода можно ввести один из 8 резервных кодов (каждый — один раз);
 *  - администратор может сбросить 2FA пользователю, потерявшему телефон;
 *  - TWO_FACTOR_REQUIRED_ROLES=admin,editor — для этих ролей админка не даёт работать, пока 2FA не включена.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import type { CollectionBeforeLoginHook, Endpoint, Field, Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

export const OTP_COOKIE = 'jet-2fa'
const ISSUER = 'jet.su'
const STEP = 30
const MAX_FAILS = 5
const LOCK_MS = 15 * 60_000

// ---------- TOTP (RFC 6238) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const base32Encode = (buf: Buffer) => {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

export const base32Decode = (s: string) => {
  const clean = s.replace(/=+$/, '').replace(/\s/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const i = B32.indexOf(ch)
    if (i < 0) continue
    value = (value << 5) | i
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

export const totpAt = (secret: string, step: number) => {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 15
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(code).padStart(6, '0')
}

const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP)

/** Номер шага, на котором код верен (±1 шаг на расхождение часов), или null. */
export const verifyTotp = (secret: string, code: string, lastStep = -1, now = Date.now()) => {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return null
  const step = currentStep(now)
  for (const s of [step, step - 1, step + 1]) {
    if (s <= lastStep) continue // один код — один вход
    const expected = totpAt(secret, s)
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return s
  }
  return null
}

export const newSecret = () => base32Encode(randomBytes(20))

const hashCode = (code: string) => createHash('sha256').update(code.replace(/[\s-]/g, '').toLowerCase()).digest('hex')

export const newRecoveryCodes = () =>
  Array.from({ length: 8 }, () => {
    const raw = randomBytes(5).toString('hex')
    return `${raw.slice(0, 5)}-${raw.slice(5)}`
  })

export const otpauthUri = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`${ISSUER}:${email}`)}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=${STEP}`

export const requiredRoles = () =>
  (process.env.TWO_FACTOR_REQUIRED_ROLES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

// ---------- поля пользователя ----------
type TwoFactorDoc = {
  id: number
  email?: string
  role?: string
  totpEnabled?: boolean | null
  totpSecret?: string | null
  totpPending?: string | null
  totpLastStep?: number | null
  totpRecovery?: string[] | null
}

export const twoFactorFields: Field[] = [
  {
    name: 'totpEnabled',
    label: 'Двухфакторный вход',
    type: 'checkbox',
    defaultValue: false,
    access: { create: () => false, update: () => false },
    admin: {
      position: 'sidebar',
      readOnly: true,
      components: { Field: '/components/TwoFactor#TwoFactorField' },
    },
  },
  { name: 'totpSecret', type: 'text', hidden: true },
  { name: 'totpPending', type: 'text', hidden: true },
  { name: 'totpLastStep', type: 'number', hidden: true },
  { name: 'totpRecovery', type: 'json', hidden: true },
]

const readSecrets = async (payload: Payload, id: number | string) =>
  (await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, showHiddenFields: true })) as unknown as TwoFactorDoc

const cookieCode = (req: PayloadRequest) => {
  const raw = req.headers.get('cookie') ?? ''
  const m = raw.match(new RegExp(`(?:^|;\\s*)${OTP_COOKIE}=([^;]*)`))
  return m ? decodeURIComponent(m[1]).trim() : ''
}

const fails = new Map<string, { n: number; until: number }>()

/** Проверка кода при входе (и при входе после сброса пароля). */
export const twoFactorBeforeLogin: CollectionBeforeLoginHook = async ({ req, user }) => {
  const u = user as TwoFactorDoc
  if (!u?.totpEnabled) return user
  const key = String(u.id)
  const f = fails.get(key)
  if (f && f.until > Date.now()) throw new APIError('Слишком много неверных кодов. Попробуйте через 15 минут', 429, undefined, true)

  const code = cookieCode(req)
  if (!code) throw new APIError('Введите код из приложения-аутентификатора в поле под формой входа', 401, undefined, true)

  const doc = await readSecrets(req.payload, u.id)
  const step = doc.totpSecret ? verifyTotp(doc.totpSecret, code, doc.totpLastStep ?? -1) : null
  let recovery = doc.totpRecovery ?? []
  let ok = step !== null
  if (!ok && recovery.includes(hashCode(code))) {
    recovery = recovery.filter((h) => h !== hashCode(code))
    ok = true
  }
  if (!ok) {
    const n = (f && f.until > Date.now() - LOCK_MS ? f.n : 0) + 1
    fails.set(key, { n, until: n >= MAX_FAILS ? Date.now() + LOCK_MS : 0 })
    throw new APIError('Неверный код двухфакторной проверки', 401, undefined, true)
  }
  fails.delete(key)
  // запоминаем шаг (код нельзя использовать второй раз) и списываем резервный код — в той же транзакции входа
  await req.payload.db.updateOne({
    collection: 'users',
    id: u.id,
    data: { totpLastStep: step ?? doc.totpLastStep ?? null, totpRecovery: recovery },
    req,
    returning: false,
  })
  return user
}

// ---------- эндпоинты ----------
const me = (req: PayloadRequest) => {
  if (!req.user) throw new APIError('Нужно войти', 401)
  return req.user as unknown as TwoFactorDoc
}

const body = async (req: PayloadRequest) => ((await req.json?.().catch(() => ({}))) ?? {}) as Record<string, unknown>

const save = (payload: Payload, id: number | string, data: Partial<TwoFactorDoc>) =>
  payload.update({ collection: 'users', id, data: data as never, overrideAccess: true, depth: 0 })

export const twoFactorEndpoints: Endpoint[] = [
  {
    // состояние для интерфейса: включена ли 2FA, обязательна ли для моей роли
    path: '/2fa/status',
    method: 'get',
    handler: async (req) => {
      const u = me(req)
      return Response.json({ enabled: !!u.totpEnabled, required: requiredRoles().includes(u.role ?? '') })
    },
  },
  {
    // шаг 1: новый секрет и QR-код (секрет ждёт подтверждения кодом)
    path: '/2fa/setup',
    method: 'post',
    handler: async (req) => {
      const u = me(req)
      const secret = newSecret()
      await save(req.payload, u.id, { totpPending: secret })
      const uri = otpauthUri(secret, u.email ?? String(u.id))
      const QRCode = (await import('qrcode')).default
      const qr = await QRCode.toString(uri, { type: 'svg', margin: 1, width: 200 })
      return Response.json({ secret, uri, qr })
    },
  },
  {
    // шаг 2: подтверждение кодом → 2FA включена, выдаются резервные коды (показываются один раз)
    path: '/2fa/enable',
    method: 'post',
    handler: async (req) => {
      const u = me(req)
      const { code } = await body(req)
      const doc = await readSecrets(req.payload, u.id)
      if (!doc.totpPending) return Response.json({ error: 'Сначала получите QR-код' }, { status: 400 })
      const step = verifyTotp(doc.totpPending, String(code ?? ''))
      if (step === null) return Response.json({ error: 'Код не подошёл. Проверьте время на телефоне и введите свежий код' }, { status: 400 })
      const codes = newRecoveryCodes()
      await save(req.payload, u.id, {
        totpEnabled: true,
        totpSecret: doc.totpPending,
        totpPending: null,
        totpLastStep: step,
        totpRecovery: codes.map(hashCode),
      })
      return Response.json({ enabled: true, recoveryCodes: codes })
    },
  },
  {
    // выключить у себя (нужен действующий код) или сбросить другому (только администратор)
    path: '/2fa/disable',
    method: 'post',
    handler: async (req) => {
      const u = me(req)
      const data = await body(req)
      const targetId = data.user ? String(data.user) : String(u.id)
      const self = targetId === String(u.id)
      if (!self && u.role !== 'admin') return Response.json({ error: 'Сбросить 2FA другому может только администратор' }, { status: 403 })
      if (self) {
        const doc = await readSecrets(req.payload, u.id)
        const code = String(data.code ?? '')
        const valid = (doc.totpSecret && verifyTotp(doc.totpSecret, code, doc.totpLastStep ?? -1) !== null) || (doc.totpRecovery ?? []).includes(hashCode(code))
        if (!valid) return Response.json({ error: 'Неверный код' }, { status: 400 })
        if (requiredRoles().includes(u.role ?? '')) return Response.json({ error: 'Для вашей роли двухфакторный вход обязателен' }, { status: 400 })
      }
      await save(req.payload, targetId, { totpEnabled: false, totpSecret: null, totpPending: null, totpLastStep: null, totpRecovery: [] })
      return Response.json({ enabled: false })
    },
  },
]
