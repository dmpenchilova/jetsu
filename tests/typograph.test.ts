import { describe, expect, it } from 'vitest'

import { typograph } from '../src/lib/typograph'

const N = ' '
const show = (s: string) => s.replace(/ /g, '~')

describe('типограф', () => {
  it('кавычки-ёлочки и вложенные', () => {
    expect(typograph('Компания "Инфосистемы Джет" и "проект "Облако""')).toBe(`Компания «Инфосистемы${N}Джет» и${N}«проект „Облако“»`)
  })

  it('тире и неразрывный пробел перед ним', () => {
    expect(show(typograph('ИБ - это важно'))).toBe('ИБ~— это~важно')
  })

  it('короткие слова привязываются к следующему', () => {
    expect(show(typograph('Мы работаем в Москве и в регионах'))).toBe('Мы~работаем в~Москве и~в~регионах')
  })

  it('числа, проценты, диапазоны, разряды', () => {
    expect(show(typograph('Более 30 лет, рост 15 %, 10-20 проектов, 1 000 000 рублей'))).toBe('Более 30~лет, рост 15~%, 10–20~проектов, 1~000~000~рублей')
  })

  it('ё → е и многоточие', () => {
    expect(typograph('Ещё...')).toBe('Еще…')
    expect(typograph('Ещё', { yo: false })).toBe('Ещё')
  })

  it('HTML: теги и атрибуты не трогаются', () => {
    const html = '<p>Смотрите <a href="https://jet.su/a-b" target="_blank">"сайт"</a> - тут</p><code>"x" - y</code>'
    expect(typograph(html)).toBe(`<p>Смотрите <a href="https://jet.su/a-b" target="_blank">«сайт»</a>${N}— тут</p><code>"x" - y</code>`)
  })

  it('сущности не ломаются', () => {
    expect(typograph('A &amp; B')).toBe('A &amp; B')
  })

  it('английский', () => {
    expect(show(typograph('We are "Jet Infosystems" - since 1991', { locale: 'en' }))).toBe('We~are~“Jet~Infosystems”~– since 1991')
  })

  it('повторный прогон ничего не меняет', () => {
    const samples = [
      'Компания "Инфосистемы Джет" - лидер рынка ИБ, 30 лет на рынке и т. д.',
      '<p>Проект "А" и "Б" - в работе</p><ul><li>Шаг 1 - анализ</li></ul>',
      'We are "Jet" - in 5 countries',
    ]
    for (const s of samples) {
      const once = typograph(s)
      expect(typograph(once)).toBe(once)
    }
  })
})
