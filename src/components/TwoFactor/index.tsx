/**
 * Под формой входа: поле кода 2FA и кнопка корпоративного SSO (если настроен).
 */
import { ssoEnabled, ssoLabel } from '../../lib/sso'
import { LoginCode } from './client'

export { TwoFactorField, TwoFactorGate } from './client'

export const LoginExtras = () => (
  <>
    <LoginCode />
    {ssoEnabled() && (
      <div className="jet-sso">
        <span>или</span>
        {/* переход на сервер (редирект к провайдеру), не страница Next — поэтому обычная ссылка */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="jet-btn jet-btn--light" href="/cms-api/users/sso/login">
          {ssoLabel()}
        </a>
      </div>
    )}
  </>
)
