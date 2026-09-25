import type { Field, GlobalConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { otherShapes } from '../blocks'
import { objectFields } from '../blocks/fields'
import type { Shape } from '../blocks/shape'
import { revalidateFront } from '../lib/revalidate'

const propsOf = (shape: Shape | undefined) => (shape?.kind === 'object' ? shape.props : [])

const commonProps = propsOf(otherShapes.common)
export const headerShape = commonProps.find((p) => p.key === 'header')!.shape
export const footerShape = commonProps.find((p) => p.key === 'footer')!.shape
export const page404Shape = otherShapes.page404
export const popupCallbackShape = otherShapes.popupCallback

/** Все поля верхнего уровня — свои для RU и EN. */
const localize = (fields: Field[]): Field[] =>
  fields.map((f) => ('name' in f ? ({ ...f, localized: true } as Field) : f))

const shapeGlobal = (slug: string, label: string, shape: Shape, tags: string[], description?: string): GlobalConfig => ({
  slug,
  label,
  admin: { group: 'Настройки сайта', description },
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
  fields: localize(objectFields(propsOf(shape), true)),
})

export const Header = shapeGlobal('header', 'Хедер', headerShape, ['common'], 'Меню до трёх уровней и кнопки в шапке')
export const Footer = shapeGlobal('footer', 'Футер', footerShape, ['common'])
export const NotFound = shapeGlobal('not-found', 'Страница 404', page404Shape, ['not-found'])
export const PopupCallback = shapeGlobal(
  'popup-callback',
  'Попап «Связаться с нами»',
  popupCallbackShape,
  ['callback'],
  'Форма, которая открывается по кнопке в шапке',
)

export const globals = [Header, Footer, NotFound, PopupCallback]
