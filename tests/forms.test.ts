import { describe, expect, it } from 'vitest'

import { allowedExtensions, cleanText, validateSubmission, type FormFieldDef } from '../src/lib/forms/validate'

const defs: FormFieldDef[] = [
  { type: 'input', name: 'name', placeholder: 'Имя*', validations: ['required'] },
  { type: 'input', name: 'email', placeholder: 'Email*', validations: ['required', 'email'] },
  { type: 'phone', name: 'phone', placeholder: 'Телефон', validations: ['phone'] },
  { type: 'file', name: 'file', acceptedFileTypes: ['application/pdf', '.doc,', '.docx'] },
]
const pdf = { name: 'cv.pdf', type: 'application/pdf', size: 20, data: Buffer.from('%PDF-1.4 test') }
const opts = { maxFileBytes: 1024 * 1024 }

describe('проверка заявок', () => {
  it('принимает правильную заявку и отбрасывает лишние поля', () => {
    const res = validateSubmission(defs, { name: 'Иван', email: 'ivan@example.com', phone: '+7 (999) 123-45-67', hack: 'x' }, { file: [pdf] }, opts)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.fields.map((f) => f.name)).toEqual(['name', 'email', 'phone', 'file'])
      expect(res.fields[0].label).toBe('Имя')
      expect(res.files).toHaveLength(1)
    }
  })

  it('обязательные поля, e-mail и телефон', () => {
    const res = validateSubmission(defs, { email: 'bad', phone: '12' }, {}, opts)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors).toEqual({ name: 'Обязательное поле', email: 'Неверный e-mail', phone: 'Неверный номер телефона' })
  })

  it('файлы: тип, подделка под PDF, размер', () => {
    const exe = { ...pdf, name: 'cv.exe' }
    const fake = { ...pdf, data: Buffer.from('MZ....') }
    const big = { ...pdf, size: 5 * 1024 * 1024 }
    for (const file of [exe, fake, big]) {
      const res = validateSubmission(defs, { name: 'И', email: 'a@b.ru' }, { file: [file] }, opts)
      expect(res.ok).toBe(false)
    }
  })

  it('типы файлов из формы: MIME и расширения с мусором', () => {
    expect(allowedExtensions(['application/pdf', '.doc,', 'docx'])).toEqual(['.pdf', '.doc', '.docx'])
  })

  it('чистка текста: теги и управляющие символы', () => {
    expect(cleanText(' ООО <b>Ромашка</b>\u0007 ')).toBe('ООО Ромашка')
  })
})
