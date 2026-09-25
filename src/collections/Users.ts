import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { adminFieldOnly, adminOrSelf, isAdmin, ROLES } from '../access'

/** Парольная политика из ТЗ: 12 символов для пользователей, 14 — для администраторов. */
const checkPassword = (password: string, role: string | undefined) => {
  const min = role === 'admin' ? 14 : 12
  const problems: string[] = []
  if (password.length < min) problems.push(`не короче ${min} символов`)
  if (!/[a-zа-яё]/.test(password) || !/[A-ZА-ЯЁ]/.test(password)) problems.push('строчные и заглавные буквы')
  if (!/\d/.test(password)) problems.push('цифры')
  if (!/[^\p{L}\d]/u.test(password)) problems.push('спецсимволы')
  if (problems.length) throw new APIError(`Пароль должен содержать: ${problems.join(', ')}`, 400, undefined, true)
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: 'Система',
  },
  auth: {
    tokenExpiration: 8 * 60 * 60,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // secure-куки только на https: иначе Safari не сохраняет вход на http://localhost
    cookies: { sameSite: 'Strict', secure: (process.env.SERVER_URL ?? '').startsWith('https://') },
  },
  access: {
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, originalDoc, req }) => {
        // первый пользователь, созданный через экран регистрации, становится администратором
        if (operation === 'create' && data) {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) data.role = 'admin'
        }
        const password = (data as { password?: string } | undefined)?.password
        if (password) {
          const role = (data?.role ?? originalDoc?.role) as string | undefined
          checkPassword(password, role)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Имя и фамилия', type: 'text', required: true },
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [...ROLES],
      saveToJWT: true,
      access: { update: adminFieldOnly, create: adminFieldOnly },
    },
  ],
}
