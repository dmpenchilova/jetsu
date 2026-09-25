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
    cookies: { sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' },
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
      async ({ data, originalDoc, req }) => {
        const password = (data as { password?: string } | undefined)?.password
        if (password) {
          const role = (data?.role ?? originalDoc?.role) as string | undefined
          checkPassword(password, role)
        }
        // первый пользователь, созданный через экран регистрации, становится администратором
        if (!originalDoc && data && !data.role) {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) data.role = 'admin'
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
