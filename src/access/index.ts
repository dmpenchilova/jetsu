import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const ROLES = [
  { label: 'Администратор', value: 'admin' },
  { label: 'Редактор', value: 'editor' },
  { label: 'Автор', value: 'author' },
  { label: 'HR', value: 'hr' },
] as const

export type Role = (typeof ROLES)[number]['value']

type WithRole = { role?: Role | null }

export const roleOf = (req: PayloadRequest): Role | undefined =>
  (req.user as WithRole | null | undefined)?.role ?? undefined

export const hasRole =
  (...roles: Role[]): Access =>
  ({ req }) => {
    const role = roleOf(req)
    return !!role && roles.includes(role)
  }

export const isAdmin = hasRole('admin')
export const isLoggedIn: Access = ({ req }) => !!req.user

/** Администратор видит всех, остальные — только себя. */
export const adminOrSelf: Access = ({ req }) => {
  if (roleOf(req) === 'admin') return true
  if (!req.user) return false
  return { id: { equals: req.user.id } }
}

export const adminFieldOnly: FieldAccess = ({ req }) => roleOf(req) === 'admin'

/** Кто может публиковать (авторы сохраняют только черновики). */
export const canPublish = (req: PayloadRequest) => {
  const role = roleOf(req)
  return role === 'admin' || role === 'editor'
}
