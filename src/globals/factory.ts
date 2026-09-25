import type { Field, GlobalConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { objectFields } from '../blocks/fields'
import type { Shape } from '../blocks/shape'
import { revalidateFront } from '../lib/revalidate'

export const propsOf = (shape: Shape | undefined) => (shape?.kind === 'object' ? shape.props : [])


/** Все поля верхнего уровня — свои для RU и EN. */
const localize = (fields: Field[]): Field[] =>
  fields.map((f) => ('name' in f ? ({ ...f, localized: true } as Field) : f))

export const shapeGlobal = (
  slug: string,
  label: string,
  shape: Shape,
  tags: string[],
  description?: string,
  extraFields: Field[] = [],
  group = 'Настройки сайта',
): GlobalConfig => ({
  slug,
  label,
  admin: { group, description },
  access: { read: isLoggedIn, update: hasRole('admin', 'editor') },
  versions: { max: 20, drafts: false },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        await revalidateFront(req.payload, tags)
        return doc
      },
    ],
  },
  fields: [...localize(objectFields(propsOf(shape), true)), ...extraFields],
})
