import { otherShapes } from '../blocks'
import { propsOf, shapeGlobal } from './factory'
import { sectionGlobals } from './sections'

const commonProps = propsOf(otherShapes.common)
export const headerShape = commonProps.find((p) => p.key === 'header')!.shape
export const footerShape = commonProps.find((p) => p.key === 'footer')!.shape
export const page404Shape = otherShapes.page404
export const popupCallbackShape = otherShapes.popupCallback

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

export const globals = [Header, Footer, NotFound, PopupCallback, ...sectionGlobals]
