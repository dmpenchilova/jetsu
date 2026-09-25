// Заглушки для стилей, картинок и браузерных библиотек, чтобы схемы фронта загружались в Node.
import { register } from 'node:module'

register(new URL('./stub-hooks.mjs', import.meta.url))
