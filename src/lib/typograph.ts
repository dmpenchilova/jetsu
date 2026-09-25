/**
 * Типограф: приводит текст к правилам вёрстки. Работает с HTML — меняет только текст между тегами,
 * теги, атрибуты и сущности не трогает. Повторный прогон ничего не меняет.
 *
 * Неразрывный пробел ставится символом U+00A0 (а не &nbsp;): так он работает
 * и в полях с HTML, и в обычных текстовых полях.
 */

export type TypographOptions = {
  locale?: 'ru' | 'en'
  /** ё → е */
  yo?: boolean
  /** Неразрывный дефис (U+2011) в коротких словах через дефис. В шрифте OnyOne такого знака нет. */
  nbHyphen?: boolean
}

const NBSP = '\u00A0'
const LETTERS = 'A-Za-zА-Яа-яЁё'
const SKIP_TAGS = /^(script|style|code|pre|textarea)$/i

const typoText = (input: string, o: Required<TypographOptions>, state: { quoteDepth: number }) => {
  let s = input

  if (o.yo) s = s.replace(/ё/g, 'е').replace(/Ё/g, 'Е')

  // несколько пробелов подряд → один (переводы строк сохраняем)
  s = s.replace(/[ \t]{2,}/g, ' ')

  // многоточие
  s = s.replace(/\.{3}/g, '…')

  // кавычки: "…" → «…» (внутри — „…“); для английского — “…” и ‘…’
  const [open1, close1, open2, close2] = o.locale === 'en' ? ['“', '”', '‘', '’'] : ['«', '»', '„', '“']
  s = s.replace(/["«»„“”]/g, (ch, offset: number, str: string) => {
    const prev = offset > 0 ? str[offset - 1] : ''
    const opening = ch === '«' || ch === '„' || (ch !== '»' && ch !== '”' && ch !== '“' && (!prev || /[\s(\[\u00A0—–-]/.test(prev)))
    if (ch === '“' && o.locale !== 'en') {
      // «“» в русском тексте — закрывающая внутренняя
      state.quoteDepth = Math.max(0, state.quoteDepth - 1)
      return close2
    }
    if (opening) {
      state.quoteDepth += 1
      return state.quoteDepth > 1 ? open2 : open1
    }
    const depth = state.quoteDepth
    state.quoteDepth = Math.max(0, depth - 1)
    return depth > 1 ? close2 : close1
  })

  // тире: « - » и « – » между словами → неразрывный пробел + тире + пробел
  if (o.locale === 'en') s = s.replace(/(^|\S)[ \u00A0]+[-–—][ \u00A0]+/g, `$1${NBSP}– `)
  else s = s.replace(/(^|\S)[ \u00A0]+[-–—][ \u00A0]+/g, `$1${NBSP}— `)
  // тире в начале строки (прямая речь, пункты)
  s = s.replace(/(^|\n)[-–] /g, o.locale === 'en' ? '$1– ' : '$1— ')

  // диапазоны чисел: 10-20 → 10–20
  s = s.replace(/(\d)-(\d)/g, '$1–$2')

  // неразрывный пробел после коротких слов (предлоги, союзы): «в работе», «и сервисы»
  const short = new RegExp(`(^|[\\s(«„“"'\\u00A0—–])([${LETTERS}]{1,3})[ ](?=[${LETTERS}\\d«„“"(])`, 'g')
  s = s.replace(short, `$1$2${NBSP}`)
  s = s.replace(short, `$1$2${NBSP}`)

  // частицы привязываются к предыдущему слову
  s = s.replace(new RegExp(`([${LETTERS}]) (ли|ль|же|ж|бы|б)(?=[\\s.,!?;:)]|$)`, 'g'), `$1${NBSP}$2`)

  // число и то, что за ним: 10 лет, 5 %, 100 ₽; № 5
  s = s.replace(new RegExp(`(\\d) (?=[${LETTERS}%‰₽$€°])`, 'g'), `$1${NBSP}`)
  s = s.replace(/(№|§) ?(?=\d)/g, `$1${NBSP}`)
  // группы разрядов: 1 000 000
  s = s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)

  // сокращения: т. д., т. е., и т. п.
  s = s.replace(/(^|[\s\u00A0])(т|и|др|пр)\. ?(д|е|п|к|р)\./g, `$1$2.${NBSP}$3.`)
  // инициалы: А. С. Пушкин
  s = s.replace(/([А-ЯЁA-Z])\. ?([А-ЯЁA-Z])\. ([А-ЯЁA-Z][а-яёa-z]+)/g, `$1.${NBSP}$2.${NBSP}$3`)

  // название компании не разрывается
  s = s.replace(/Инфосистемы[ \u00A0]+Джет/g, `Инфосистемы${NBSP}Джет`)
  s = s.replace(/Jet[ \u00A0]+Infosystems/g, `Jet${NBSP}Infosystems`)

  if (o.nbHyphen) s = s.replace(new RegExp(`(^|[^${LETTERS}])([${LETTERS}]{1,3})-([${LETTERS}]+)`, 'g'), '$1$2‑$3')

  return s
}

/** Типографирует строку (обычный текст или HTML). */
export const typograph = (value: string, options: TypographOptions = {}) => {
  if (!value || !/[^\s]/.test(value)) return value
  const o: Required<TypographOptions> = { locale: options.locale ?? 'ru', yo: options.yo ?? true, nbHyphen: options.nbHyphen ?? false }
  const state = { quoteDepth: 0 }
  // делим на теги и текст; текст внутри <code>, <pre> и т. п. не трогаем
  const parts = value.split(/(<[^>]*>)/g)
  let skip = 0
  return parts
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        const m = /^<\s*(\/)?\s*([a-z0-9]+)/i.exec(part)
        if (m && SKIP_TAGS.test(m[2])) skip += m[1] ? -1 : 1
        return part
      }
      if (skip > 0 || !part) return part
      // сущности (&amp;, &nbsp;) не разбираем
      return part
        .split(/(&[a-z0-9#]+;)/gi)
        .map((chunk) => (/^&[a-z0-9#]+;$/i.test(chunk) ? chunk : typoText(chunk, o, state)))
        .join('')
    })
    .join('')
}
