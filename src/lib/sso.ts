/**
 * Вход в админку через корпоративный SSO (OpenID Connect: Keycloak, ADFS, Azure AD / Entra ID, Яндекс 360 и др.).
 *
 * Включается переменными окружения:
 *   SSO_ISSUER         адрес провайдера, например https://sso.jet.su/realms/jet
 *   SSO_CLIENT_ID      идентификатор приложения «админка jet.su» у провайдера
 *   SSO_CLIENT_SECRET  его секрет
 *   SSO_LABEL          надпись на кнопке (по умолчанию «Войти через корпоративный SSO»)
 *   SSO_ALLOWED_DOMAINS  домены почты через запятую (по умолчанию — любые)
 *   SSO_AUTO_CREATE_ROLE роль для новых сотрудников (author/editor/hr); пусто — входят только заведённые в админке
 * Адрес возврата, который нужно указать у провайдера: https://<админка>/cms-api/users/sso/callback
 *
 * Сотрудник входит по почте: пользователь админки с той же почтой. Второй фактор в этом случае
 * проверяет сам SSO-провайдер, поэтому код из приложения не спрашивается.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import type { Endpoint, PayloadRequest } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

const STATE_COOKIE = 'jet-sso'

export const ssoEnabled = () => !!(process.env.SSO_ISSUER && process.env.SSO_CLIENT_ID && process.env.SSO_CLIENT_SECRET)
export const ssoLabel = () => process.env.SSO_LABEL || 'Войти через корпоративный SSO'

type Discovery = { authorization_endpoint: string; token_endpoint: string; userinfo_endpoint: string }
let discovery: { at: number; doc: Discovery } | null = null

const discover = async () => {
  if (discovery && Date.now() - discovery.at < 3600_000) return discovery.doc
  const issuer = (process.env.SSO_ISSUER || '').replace(/\/$/, '')
  const res = await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`SSO: провайдер не ответил (${res.status})`)
  const doc = (await res.json()) as Discovery
  discovery = { at: Date.now(), doc }
  return doc
}

const b64url = (buf: Buffer) => buf.toString('base64url')
const sign = (secret: string, value: string) => b64url(createHmac('sha256', secret).update(value).digest())

const serverUrl = (req: PayloadRequest) => (process.env.SERVER_URL || new URL(req.url ?? 'http://localhost').origin).replace(/\/$/, '')
const callbackUrl = (req: PayloadRequest) => `${serverUrl(req)}/cms-api/users/sso/callback`
const secure = () => (process.env.SERVER_URL ?? '').startsWith('https://')

const readCookie = (req: PayloadRequest, name: string) => {
  const m = (req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : ''
}

/** Страница ошибки: коротко и со ссылкой обратно на вход. */
const fail = (message: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>Вход через SSO</title><body style="font-family:system-ui;max-width:520px;margin:15vh auto;padding:0 16px"><h2>Не удалось войти</h2><p>${message.replace(/</g, '&lt;')}</p><p><a href="/admin/login">Вернуться ко входу</a></p></body>`,
    { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': `${STATE_COOKIE}=; Path=/cms-api/users/sso; Max-Age=0` } },
  )

export const ssoEndpoints: Endpoint[] = [
  {
    path: '/sso/login',
    method: 'get',
    handler: async (req) => {
      if (!ssoEnabled()) return fail('Вход через SSO не настроен')
      const d = await discover()
      const state = b64url(randomBytes(16))
      const verifier = b64url(randomBytes(32))
      const challenge = b64url(createHash('sha256').update(verifier).digest())
      const value = `${state}.${verifier}`
      const cookie = `${STATE_COOKIE}=${value}.${sign(req.payload.secret, value)}; Path=/cms-api/users/sso; HttpOnly; SameSite=Lax; Max-Age=600${secure() ? '; Secure' : ''}`
      const url = new URL(d.authorization_endpoint)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('client_id', process.env.SSO_CLIENT_ID || '')
      url.searchParams.set('redirect_uri', callbackUrl(req))
      url.searchParams.set('scope', 'openid email profile')
      url.searchParams.set('state', state)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 'S256')
      return new Response(null, { status: 302, headers: { Location: url.toString(), 'Set-Cookie': cookie } })
    },
  },
  {
    path: '/sso/callback',
    method: 'get',
    handler: async (req) => {
      if (!ssoEnabled()) return fail('Вход через SSO не настроен')
      const params = new URL(req.url ?? '', 'http://x').searchParams
      if (params.get('error')) return fail(`Провайдер отказал: ${params.get('error_description') || params.get('error')}`)
      const [state, verifier, mac] = readCookie(req, STATE_COOKIE).split('.')
      const expected = state && verifier ? sign(req.payload.secret, `${state}.${verifier}`) : ''
      if (!mac || mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) || params.get('state') !== state) {
        return fail('Сессия входа устарела. Попробуйте ещё раз')
      }

      const d = await discover()
      const tokenRes = await fetch(d.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.get('code') ?? '',
          redirect_uri: callbackUrl(req),
          client_id: process.env.SSO_CLIENT_ID || '',
          client_secret: process.env.SSO_CLIENT_SECRET || '',
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(8000),
      })
      const tokens = (await tokenRes.json().catch(() => ({}))) as { access_token?: string }
      if (!tokenRes.ok || !tokens.access_token) return fail('Провайдер не выдал токен')
      const infoRes = await fetch(d.userinfo_endpoint, { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(8000) })
      const info = (await infoRes.json().catch(() => ({}))) as { email?: string; email_verified?: boolean; name?: string; preferred_username?: string }
      const email = (info.email ?? '').trim().toLowerCase()
      if (!email || info.email_verified === false) return fail('У учётной записи SSO нет подтверждённой почты')
      const domains = (process.env.SSO_ALLOWED_DOMAINS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (domains.length && !domains.includes(email.split('@')[1] ?? '')) return fail(`Вход разрешён только с почтой ${domains.join(', ')}`)

      const { payload } = req
      const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
      let userId = found.docs[0]?.id
      if (!userId) {
        const role = process.env.SSO_AUTO_CREATE_ROLE
        if (!role || !['author', 'editor', 'hr'].includes(role)) return fail(`Пользователя ${email} нет в админке. Попросите администратора добавить вас`)
        const created = await payload.create({
          collection: 'users',
          data: { email, name: info.name || info.preferred_username || email, role, password: `${b64url(randomBytes(24))}Aa1!` } as never,
          overrideAccess: true,
        })
        userId = created.id
        payload.logger.info(`SSO: создан пользователь ${email} (${role})`)
      }

      // сессия и cookie — так же, как при обычном входе
      const collection = payload.collections.users.config
      const user = (await payload.db.findOne({ collection: 'users', where: { id: { equals: userId } }, req })) as Record<string, unknown> & {
        id: number
        email: string
        sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[]
      }
      let sid: string | undefined
      if (collection.auth.useSessions) {
        sid = crypto.randomUUID()
        const now = new Date()
        const sessions = (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now)
        sessions.push({ id: sid, createdAt: now, expiresAt: new Date(now.getTime() + collection.auth.tokenExpiration * 1000) })
        await payload.db.updateOne({ collection: 'users', id: user.id, data: { sessions, updatedAt: null } as never, req, returning: false })
      }
      const fieldsToSign = getFieldsToSign({ collectionConfig: collection, email: user.email, sid, user: { ...user, collection: 'users' } as never })
      const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration: collection.auth.tokenExpiration })
      const cookie = generatePayloadCookie({ collectionAuthConfig: collection.auth, cookiePrefix: payload.config.cookiePrefix, token })
      const { writeAudit } = await import('../collections/AuditLog')
      await writeAudit({ req: { ...req, user: { ...user, collection: 'users' } } as never, action: 'login', target: `Пользователь № ${user.id}`, summary: `Вход через SSO: ${email}` }).catch(() => undefined)

      const headers = new Headers({ Location: '/admin' })
      headers.append('Set-Cookie', cookie)
      headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/cms-api/users/sso; Max-Age=0`)
      return new Response(null, { status: 302, headers })
    },
  },
]
