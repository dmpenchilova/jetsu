/**
 * Проверка заявки на сервере по описанию формы — те же правила, что во фронте,
 * плюс ограничения на размер и типы файлов. Лишние поля отбрасываются.
 */

export type FormFieldDef = {
  type: 'input' | 'phone' | 'textarea' | 'file'
  name: string
  label?: string | null
  placeholder?: string | null
  validations?: string[] | null
  multiple?: boolean | null
  acceptedFileTypes?: string[] | null
}

export type IncomingFile = { name: string; type: string; size: number; data: Buffer }

export type CleanField = { name: string; label: string; value: string }

export type ValidationResult =
  | { ok: true; fields: CleanField[]; files: { field: string; file: IncomingFile }[] }
  | { ok: false; errors: Record<string, string> }

const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/
const MAX_TEXT = 5000
const MAX_FILES = 5

/** Безопасные расширения файлов, если в форме список не задан. */
const DEFAULT_EXT = ['.pdf', '.doc', '.docx', '.rtf', '.odt', '.txt', '.jpg', '.jpeg', '.png']
/** Эти типы не принимаем никогда. */
const BLOCKED_EXT = ['.exe', '.bat', '.cmd', '.com', '.js', '.mjs', '.vbs', '.ps1', '.sh', '.html', '.htm', '.svg', '.php', '.jar', '.msi', '.scr', '.dll']

const MIME_EXT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

/** В форме типы бывают и расширениями (.docx), и MIME (application/pdf) — приводим к расширениям. */
export const allowedExtensions = (list: string[] | null | undefined) => {
  const out = new Set<string>()
  for (const raw of list ?? []) {
    for (const item of raw.split(/[,\s]+/)) {
      const v = item.trim().toLowerCase()
      if (!v) continue
      if (v.includes('/')) (MIME_EXT[v] ?? []).forEach((e) => out.add(e))
      else out.add(v.startsWith('.') ? v : `.${v}`)
    }
  }
  return out.size ? [...out] : DEFAULT_EXT
}

const extOf = (name: string) => {
  const m = /\.[a-z0-9]{1,8}$/i.exec(name)
  return m ? m[0].toLowerCase() : ''
}

/** Сигнатуры файлов — чтобы под .pdf не прислали что-то другое. */
const looksLike = (ext: string, data: Buffer) => {
  const head = data.subarray(0, 8)
  const hex = head.toString('hex')
  switch (ext) {
    case '.pdf':
      return head.toString('latin1').startsWith('%PDF')
    case '.docx':
    case '.odt':
      return hex.startsWith('504b0304')
    case '.doc':
      return hex.startsWith('d0cf11e0')
    case '.png':
      return hex.startsWith('89504e47')
    case '.jpg':
    case '.jpeg':
      return hex.startsWith('ffd8ff')
    case '.rtf':
      return head.toString('latin1').startsWith('{\\rtf')
    default:
      return true
  }
}

/** Убираем управляющие символы и HTML-теги: значения уходят в письма и CRM. */
export const cleanText = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, MAX_TEXT)

const digits = (v: string) => v.replace(/\D/g, '')

export const labelOf = (f: FormFieldDef) =>
  (f.label || f.placeholder || f.name).replace(/<[^>]+>/g, '').replace(/\*$/, '').trim()

export const validateSubmission = (
  defs: FormFieldDef[],
  values: Record<string, string>,
  files: Record<string, IncomingFile[]>,
  opts: { maxFileBytes: number; en?: boolean },
): ValidationResult => {
  const t = opts.en
    ? { required: 'Required field', email: 'Invalid e-mail', phone: 'Invalid phone number', type: 'File type is not allowed', size: 'File is too large', many: 'Too many files', broken: 'File content does not match its type' }
    : { required: 'Обязательное поле', email: 'Неверный e-mail', phone: 'Неверный номер телефона', type: 'Такой тип файла не принимается', size: 'Файл слишком большой', many: 'Слишком много файлов', broken: 'Содержимое файла не соответствует типу' }
  const errors: Record<string, string> = {}
  const clean: CleanField[] = []
  const outFiles: { field: string; file: IncomingFile }[] = []

  for (const def of defs) {
    const rules = def.validations ?? []
    const required = rules.includes('required')

    if (def.type === 'file') {
      const list = files[def.name] ?? []
      if (required && !list.length) errors[def.name] = t.required
      if (list.length > (def.multiple ? MAX_FILES : 1)) errors[def.name] = t.many
      const allowed = allowedExtensions(def.acceptedFileTypes)
      for (const file of list) {
        const ext = extOf(file.name)
        if (!ext || BLOCKED_EXT.includes(ext) || !allowed.includes(ext)) errors[def.name] = t.type
        else if (file.size > opts.maxFileBytes) errors[def.name] = t.size
        else if (!looksLike(ext, file.data)) errors[def.name] = t.broken
        else outFiles.push({ field: def.name, file })
      }
      if (list.length) clean.push({ name: def.name, label: labelOf(def), value: list.map((f) => f.name).join(', ') })
      continue
    }

    const value = cleanText(values[def.name] ?? '')
    if (!value) {
      if (required) errors[def.name] = t.required
      continue
    }
    if ((rules.includes('email') || /e-?mail/i.test(def.name)) && !EMAIL.test(value)) errors[def.name] = t.email
    if ((rules.includes('phone') || def.type === 'phone') && (digits(value).length < 10 || digits(value).length > 15)) errors[def.name] = t.phone
    clean.push({ name: def.name, label: labelOf(def), value })
  }

  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, fields: clean, files: outFiles }
}
