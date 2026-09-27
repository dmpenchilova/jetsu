'use client'
/**
 * Двухфакторный вход: поле кода на экране входа, настройка в профиле, напоминание для обязательных ролей.
 */
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const OTP_COOKIE = 'jet-2fa'

const setCode = (code: string) => {
  const clean = code.replace(/\s/g, '')
  document.cookie = clean
    ? `${OTP_COOKIE}=${encodeURIComponent(clean)}; Path=/cms-api/users; Max-Age=300; SameSite=Strict${location.protocol === 'https:' ? '; Secure' : ''}`
    : `${OTP_COOKIE}=; Path=/cms-api/users; Max-Age=0`
}

/** Поле «Код из приложения» под формой входа и на странице нового пароля. */
export const LoginCode = () => {
  const [value, setValue] = useState('')
  return (
    <div className="jet-2fa-login">
      <label htmlFor="jet-2fa-code" className="field-label">
        Код из приложения-аутентификатора
      </label>
      <input
        id="jet-2fa-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Если включён двухфакторный вход"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setCode(e.target.value)
        }}
      />
      <p className="jet-2fa-login__hint">Потеряли телефон — введите резервный код или попросите администратора сбросить 2FA</p>
    </div>
  )
}

type SetupState = { secret: string; uri: string; qr: string } | null

const post = async (url: string, body: unknown = {}) => {
  const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.message || 'Ошибка')
  return data
}

/** Блок в карточке пользователя: включить / выключить у себя, сбросить другому (администратор). */
export const TwoFactorField = () => {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const enabledInForm = useFormFields(([fields]) => !!fields.totpEnabled?.value)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [setup, setSetup] = useState<SetupState>(null)
  const [code, setCodeValue] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isSelf = !id || String(id) === String(user?.id)
  const isAdmin = (user as { role?: string } | null)?.role === 'admin'
  const on = enabled ?? enabledInForm

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setBusy(false)
  }

  if (!isSelf) {
    return (
      <div className="jet-2fa">
        <div className="field-label">Двухфакторный вход</div>
        <p className={on ? 'jet-2fa__on' : 'jet-2fa__off'}>{on ? 'Включён' : 'Не включён'}</p>
        {on && isAdmin && (
          <button
            type="button"
            className="jet-btn jet-btn--light"
            disabled={busy}
            onClick={() => run(async () => {
              if (!window.confirm('Сбросить двухфакторный вход? Пользователь войдёт по паролю и сможет настроить 2FA заново.')) return
              await post('/cms-api/users/2fa/disable', { user: id })
              setEnabled(false)
            })}
          >
            Сбросить (потерян телефон)
          </button>
        )}
        {error && <p className="jet-2fa__error">{error}</p>}
      </div>
    )
  }

  return (
    <div className="jet-2fa">
      <div className="field-label">Двухфакторный вход</div>
      {codes ? (
        <div>
          <p className="jet-2fa__on">Включён</p>
          <p>Резервные коды — сохраните их в менеджере паролей. Каждый код срабатывает один раз, если телефона нет под рукой. Больше они не покажутся.</p>
          <pre className="jet-2fa__codes">{codes.join('\n')}</pre>
          <button type="button" className="jet-btn jet-btn--light" onClick={() => setCodes(null)}>
            Я сохранил(а) коды
          </button>
        </div>
      ) : on ? (
        <div>
          <p className="jet-2fa__on">Включён</p>
          <input placeholder="Код для выключения" value={code} onChange={(e) => setCodeValue(e.target.value)} inputMode="numeric" />
          <button
            type="button"
            className="jet-btn jet-btn--light"
            disabled={busy || !code}
            onClick={() => run(async () => {
              await post('/cms-api/users/2fa/disable', { code })
              setEnabled(false)
              setCodeValue('')
            })}
          >
            Выключить
          </button>
        </div>
      ) : setup ? (
        <div>
          <p>1. Отсканируйте QR-код приложением (Яндекс Ключ, Google Authenticator, 1Password…)</p>
          {/* svg сгенерирован сервером библиотекой qrcode */}
          <div className="jet-2fa__qr" dangerouslySetInnerHTML={{ __html: setup.qr }} />
          <p className="jet-2fa__secret">
            Или введите ключ вручную: <code>{setup.secret}</code>
          </p>
          <p>2. Введите 6 цифр из приложения</p>
          <input value={code} onChange={(e) => setCodeValue(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
          <button
            type="button"
            className="jet-btn"
            disabled={busy || code.replace(/\s/g, '').length !== 6}
            onClick={() => run(async () => {
              const res = await post('/cms-api/users/2fa/enable', { code })
              setEnabled(true)
              setSetup(null)
              setCodeValue('')
              setCodes(res.recoveryCodes)
            })}
          >
            Включить
          </button>
        </div>
      ) : (
        <div>
          <p className="jet-2fa__off">Не включён</p>
          <p>При входе, кроме пароля, понадобится код из приложения на телефоне.</p>
          <button type="button" className="jet-btn jet-btn--light" disabled={busy} onClick={() => run(async () => setSetup(await post('/cms-api/users/2fa/setup')))}>
            Настроить
          </button>
        </div>
      )}
      {error && <p className="jet-2fa__error">{error}</p>}
    </div>
  )
}

/**
 * Для ролей из TWO_FACTOR_REQUIRED_ROLES: пока 2FA не включена, админка показывает только профиль.
 * На странице нового пароля — поле кода (вход после сброса пароля тоже проверяет код).
 */
export const TwoFactorGate = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAuth()
  const pathname = usePathname() ?? ''
  const [required, setRequired] = useState(false)
  const enabled = !!(user as { totpEnabled?: boolean } | null)?.totpEnabled

  useEffect(() => {
    if (!user) return
    let alive = true
    fetch('/cms-api/users/2fa/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => alive && setRequired(!!d.required && !d.enabled))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [user, enabled])

  const onReset = /\/admin\/reset\//.test(pathname)
  // на странице нового пароля поле кода встраивается в саму форму, над кнопкой
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!onReset) return
    let el: HTMLElement | null = null
    const place = () => {
      const button = document.querySelector('form button[type=submit]')
      if (!button || el) return !!el
      el = document.createElement('div')
      el.className = 'jet-2fa-reset'
      const row = button.closest('.form-submit') ?? button
      row.parentElement?.insertBefore(el, row)
      setSlot(el)
      return true
    }
    const timer = setInterval(() => place() && clearInterval(timer), 200)
    return () => {
      clearInterval(timer)
      el?.remove()
      setSlot(null)
    }
  }, [onReset])
  const onProfile = /\/admin\/account/.test(pathname) || (user && pathname.endsWith(`/collections/users/${user.id}`))
  return (
    <>
      {children}
      {onReset && slot && createPortal(<LoginCode />, slot)}
      {user && required && !onProfile && (
        <div className="jet-2fa-gate">
          <div className="jet-2fa-gate__box">
            <h3>Включите двухфакторный вход</h3>
            <p>Для вашей роли вход только с кодом из приложения на телефоне. Настройка займёт минуту.</p>
            <Link className="jet-btn" href="/admin/account">
              Перейти к настройке
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
