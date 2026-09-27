#!/usr/bin/env node
/**
 * Обновление контракта фронта одной командой.
 *
 *   npm run contract:update            — выгрузить схемы из фронта в src/contract и показать, что поменялось
 *   npm run contract:check             — только проверить: совпадает ли src/contract с фронтом (для CI)
 *
 * Папка фронта — FRONT_DIR (по умолчанию ../jet-front-main). У фронта должны быть установлены зависимости (npm ci).
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const admin = resolve(here, '../..')
const front = resolve(admin, process.env.FRONT_DIR || '../jet-front-main')
const checkOnly = process.argv.includes('--check')
const contract = join(admin, 'src/contract')

if (!existsSync(join(front, 'src/shared/config/block-map.ts'))) {
  console.error(`Не найден фронт в ${front}. Укажите путь: FRONT_DIR=/путь/к/jet-front-main`)
  process.exit(2)
}
if (!existsSync(join(front, 'node_modules'))) {
  console.error(`У фронта не установлены зависимости: cd ${front} && npm ci`)
  process.exit(2)
}

const tmp = mkdtempSync(join(tmpdir(), 'jet-contract-'))
try {
  execFileSync(
    process.execPath,
    ['--import', join(here, 'register.mjs'), '--import', 'tsx', join(here, 'dump.mts'), tmp],
    { cwd: front, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, NODE_PATH: join(admin, 'node_modules') } },
  )

  const read = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { blocks: {}, other: {} })
  const before = read(join(contract, 'schemas.json'))
  const after = read(join(tmp, 'schemas.json'))

  const props = (s, prefix = '') => {
    const out = new Set()
    const walk = (node, path) => {
      if (!node || typeof node !== 'object') return
      if (node.properties) for (const [k, v] of Object.entries(node.properties)) {
        out.add(`${path}${k}`)
        walk(v, `${path}${k}.`)
      }
      if (node.items) walk(node.items, `${path}[].`)
      for (const key of ['anyOf', 'oneOf', 'allOf']) (node[key] ?? []).forEach((n) => walk(n, path))
    }
    walk(s, prefix)
    return out
  }

  const changes = []
  for (const group of ['blocks', 'other']) {
    const a = before[group] ?? {}
    const b = after[group] ?? {}
    for (const k of Object.keys(b)) if (!a[k]) changes.push(`+ ${group}.${k} (новый)`)
    for (const k of Object.keys(a)) if (!b[k]) changes.push(`- ${group}.${k} (удалён)`)
    for (const k of Object.keys(b)) {
      if (!a[k] || JSON.stringify(a[k]) === JSON.stringify(b[k])) continue
      const pa = props(a[k])
      const pb = props(b[k])
      const added = [...pb].filter((p) => !pa.has(p))
      const removed = [...pa].filter((p) => !pb.has(p))
      const short = (list, sign) => (list.length ? `  ${sign}${list.slice(0, 5).join(`, ${sign}`)}${list.length > 5 ? ` …и ещё ${list.length - 5}` : ''}` : '')
      changes.push(`~ ${group}.${k}${short(added, '+')}${short(removed, '-')}${!added.length && !removed.length ? '  (типы или ограничения)' : ''}`)
    }
  }
  const fixturesChanged = (() => {
    try {
      execFileSync('diff', ['-rq', join(contract, 'fixtures'), join(tmp, 'fixtures')], { stdio: 'ignore' })
      return false
    } catch {
      return true
    }
  })()

  if (!changes.length && !fixturesChanged) {
    console.log('Контракт совпадает с фронтом — обновлять нечего.')
    process.exit(0)
  }
  console.log('Отличия от фронта:')
  for (const c of changes) console.log(`  ${c}`)
  if (fixturesChanged) console.log('  ~ тестовые данные фронта (apiStatic)')

  if (checkOnly) {
    console.error('\nКонтракт устарел: запустите npm run contract:update, затем npm test и npx payload migrate:create')
    process.exit(1)
  }
  rmSync(join(contract, 'fixtures'), { recursive: true, force: true })
  cpSync(tmp, contract, { recursive: true })
  console.log('\nsrc/contract обновлён. Дальше:')
  console.log('  npm test                         — проверить, что все блоки проходят путь «фронт → админка → фронт»')
  console.log('  npx payload migrate:create        — если у блоков появились новые поля')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
