// 内容体检：类别、媒介、专题、related、roster.entry 是否指向真实存在的文件名。
// 用法：node scripts/check-content.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'

const stems = (dir) => readdirSync(`content/${dir}`).map((f) => f.replace(/\.\w+$/, ''))
const fm = (path) => parse(/^---\n([\s\S]*?)\n---/.exec(readFileSync(path, 'utf8'))[1])

const cats = new Set(stems('categories'))
const media = new Set(stems('media'))
const entries = new Set(stems('entries'))
const series = new Set(stems('series'))
const errors = []

for (const s of entries) {
  const e = fm(`content/entries/${s}.md`)
  if (!cats.has(e.category)) errors.push(`${s}: category「${e.category}」不存在`)
  for (const side of ['game', 'work']) {
    const m = e[side]?.medium
    if (m && !media.has(m)) errors.push(`${s}: ${side}.medium「${m}」不存在`)
  }
  if (e.series && !series.has(e.series)) errors.push(`${s}: series「${e.series}」不存在`)
  for (const r of e.related ?? []) if (!entries.has(r)) errors.push(`${s}: related「${r}」不存在`)
}
for (const t of stems('topics')) {
  for (const r of fm(`content/topics/${t}.md`).entries ?? []) if (!entries.has(r)) errors.push(`topic ${t}: entries「${r}」不存在`)
}
for (const s of series) {
  for (const r of fm(`content/series/${s}.md`).roster ?? []) {
    if (r.entry && !entries.has(r.entry)) errors.push(`series ${s}: roster「${r.name}」entry「${r.entry}」不存在`)
    if (r.medium && !media.has(r.medium)) errors.push(`series ${s}: roster「${r.name}」medium「${r.medium}」不存在`)
  }
}
console.log(errors.length ? errors.join('\n') : `ok · ${entries.size} 条目`)
process.exitCode = errors.length ? 1 : 0
