import vm from 'node:vm'
import { stringify } from 'yaml'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = '/Users/administrator/Documents/WebStorm Projects/Lit.Homer'
const OUT = '/Users/administrator/Documents/WebStorm Projects/lit-homer/content'

function load(p) {
  const code = readFileSync(join(SRC, p), 'utf8')
  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(code, sandbox, { filename: p })
  return sandbox.window
}

const win = Object.assign({}, load('data/entries.js'), load('data/topics.js'), load('data/series.js'))
const entries = win.CODEX_ENTRIES || []
const topics = win.CODEX_TOPICS || []
const series = win.CODEX_SERIES || []

function pick(o, keys) {
  const out = {}
  for (const k of keys) if (o[k] !== undefined) out[k] = o[k]
  return out
}

function frontmatter(fm) {
  return '---\n' + stringify(fm).trimEnd() + '\n---\n\n'
}

const counts = { entries: 0, topics: 0, series: 0 }

mkdirSync(join(OUT, 'entries'), { recursive: true })
for (const e of entries) {
  const fm = {
    ...pick(e, ['title', 'category', 'origin', 'series']),
    game: pick(e.game || {}, ['title', 'year', 'studio', 'medium']),
    work: pick(e.work || {}, ['title', 'author', 'year', 'medium']),
    ...pick(e, ['tags', 'updated', 'quote', 'summary', 'notes', 'related']),
  }
  const body = (e.body || []).join('\n\n')
  writeFileSync(join(OUT, 'entries', e.id + '.md'), frontmatter(fm) + body + '\n')
  counts.entries++
}

mkdirSync(join(OUT, 'topics'), { recursive: true })
for (const t of topics) {
  const fm = {
    ...pick(t, ['title', 'origin', 'status', 'tags', 'updated', 'entries', 'leads']),
  }
  if (t.question !== undefined && fm.title === undefined) fm.title = t.question
  const body = (t.body || []).join('\n\n')
  writeFileSync(join(OUT, 'topics', t.id + '.md'), frontmatter(fm) + body + '\n')
  counts.topics++
}

mkdirSync(join(OUT, 'series'), { recursive: true })
for (const s of series) {
  const obj = {
    title: s.name,
    short: s.short,
    ...pick(s, ['eyebrow']),
    description: s.desc,
    ...pick(s, ['roster', 'foot']),
  }
  writeFileSync(join(OUT, 'series', s.id + '.yml'), stringify(obj))
  counts.series++
}

console.log('written:', JSON.stringify(counts))
