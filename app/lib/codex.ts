// 互文 · 游戏文学考据 —— 站点常量与纯函数。
// 仅纯数据 + 纯函数，不依赖 Vue/Nuxt，供 app 与 content.config.ts 共用。

export const CODEX_META = {
  title: '互文',
  subtitle: '游戏文学考据',
  tagline: '游戏里出现的每一本书，都值得被查明出处。',
  intro:
    '这里是一份持续生长的考据档案：游戏引用了哪部作品、用的是哪个译本、原文在说什么、它被改动成了什么。我们不只记录「彩蛋」，也追问游戏自己写得像什么。电影、戏剧与神话的改编同样收录——媒介换了，问题没变。',
  club: '文学社 · 游戏考据组',
  updated: '2026-11-03',
}

export const CATEGORY_IDS = [
  'quote',
  'motif',
  'reading',
  'edition',
  'mechanic',
  'adapt',
  'image',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface Category {
  id: CategoryId
  name: string
  desc: string
}

export const CODEX_CATEGORIES: Category[] = [
  { id: 'quote', name: '引文与出处', desc: '游戏直接引用的文本，以及它究竟出自哪一版。' },
  { id: 'motif', name: '母题与原型', desc: '神话、传说与文学母题如何在游戏里被重新组装。' },
  { id: 'reading', name: '文本细读', desc: '不给「出处」，只谈游戏文本自身的文学性。' },
  { id: 'edition', name: '译本与版本', desc: '同一句引文，不同中译本、不同语言之间的差异。' },
  { id: 'mechanic', name: '机制与叙事', desc: '玩法本身如何承担叙事与文学表达。' },
  { id: 'adapt', name: '跨媒介改编', desc: '小说、电影、游戏之间的转写：什么被保留，什么必然丢失。' },
  { id: 'image', name: '图像与视觉', desc: '版画、插图、绘画与游戏画面之间的互文：构图、光、比例。' },
]

export const MEDIA_IDS = [
  'book',
  'poem',
  'play',
  'film',
  'painting',
  'myth',
  'manga',
  'tv',
] as const

export type MediaId = (typeof MEDIA_IDS)[number]

export interface Medium {
  id: MediaId
  name: string
  art: string
  num: string
}

export const CODEX_MEDIA: Medium[] = [
  { id: 'book', name: '书', art: '文学', num: '第五艺术' },
  { id: 'poem', name: '诗', art: '文学', num: '第五艺术' },
  { id: 'play', name: '戏剧', art: '戏剧', num: '' },
  { id: 'film', name: '电影', art: '电影', num: '第七艺术' },
  { id: 'painting', name: '绘画', art: '绘画', num: '第三艺术' },
  { id: 'myth', name: '神话', art: '口头传统', num: '' },
  { id: 'manga', name: '漫画', art: '漫画', num: '第九艺术（欧陆传统）' },
  { id: 'tv', name: '剧集', art: '电视', num: '第八艺术（一说）' },
]

const MEDIA_NAME: Record<string, string> = { book: '书', film: '电影', play: '戏剧', poem: '诗', myth: '神话', manga: '漫画', tv: '剧集', painting: '绘画' }
const MEDIA_INFO: Record<string, Medium> = {}
for (const m of CODEX_MEDIA) MEDIA_INFO[m.id] = m

export function mediumName(m?: string | null): string {
  if (!m) return '书'
  return MEDIA_NAME[m] || m
}

export function mediumTitle(m?: string | null): string {
  const info = m ? MEDIA_INFO[m] : undefined
  if (!info) return ''
  return info.num ? `${info.art} · ${info.num}` : info.art || ''
}

export const ORIGINS = {
  ai: { mark: '*', label: '示例（AI 起草）', tip: 'AI 起草的示例条目，尚未由社团成员核实改写' },
  human: { mark: '**', label: '社团成员撰写', tip: '由社团成员撰写并对其内容负责' },
} as const

export function originOf(o?: string | null) {
  return o === 'human' ? ORIGINS.human : ORIGINS.ai
}

export function fmtDate(d?: string | null): string {
  if (!d) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  if (!m) return d
  return `${m[1]}.${m[2]}.${m[3]}`
}

export function statusSlug(s: string): 'open' | 'wip' | 'done' {
  return ({ 征集: 'open', 整理中: 'wip', 已完成: 'done' } as const)[s] ?? 'open'
}

export function catName(id?: string | null): string {
  return CODEX_CATEGORIES.find((c) => c.id === id)?.name || '未分类'
}

export function catDesc(id?: string | null): string {
  return CODEX_CATEGORIES.find((c) => c.id === id)?.desc || ''
}

/** 一张卡片该标什么媒介：优先看「游戏」侧的异常媒介（整条是电影），否则看「作品」侧。 */
export function mediaTagOf(e: { game?: { medium?: string } | null; work?: { medium?: string } | null }): string {
  if (e.game?.medium && e.game.medium !== 'game') return e.game.medium
  if (e.work?.medium && e.work.medium !== 'book') return e.work.medium
  return ''
}

/** 条目在门类筛选里归到哪一类。 */
export function primaryMedium(e: { game?: { medium?: string } | null; work?: { medium?: string } | null }): string {
  return mediaTagOf(e) || e.work?.medium || 'book'
}

export function sideLabel(m?: string | null): string {
  if (m === 'film') return '影 片'
  if (m === 'tv') return '剧 集'
  if (m === 'play') return '剧 目'
  if (m === 'book') return '作 品'
  return '游 戏'
}

export function creditLabel(m?: string | null): string {
  if (m === 'film') return '导 演'
  if (m === 'tv') return '主 创'
  if (m === 'play') return '编 剧'
  if (m === 'book') return '作 者'
  return '制 作'
}

export function roleLabel(m?: string | null): string {
  if (m === 'film') return '导 演'
  if (m === 'tv') return '主 创'
  return '作 者'
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c])
}

/** 极简行内标记：**粗体**、`代码`。先转义再替换，顺序安全。用于 quote/notes 等结构化字符串。 */
export function renderInline(s: unknown): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function sortByUpdated<T extends { updated?: string | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')))
}

/** 把 Nuxt Content 的 markdown AST 拍平成纯文本，供搜索用。 */
export function markdownText(node: unknown): string {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(markdownText).join(' ')
  const n = node as { value?: unknown; children?: unknown }
  if (n.value != null) return String(n.value)
  if (n.children) return markdownText(n.children)
  return ''
}

interface SearchableEntry {
  title?: string
  summary?: string
  tags?: string[]
  body?: unknown
  game?: { title?: string; studio?: string; medium?: string } | null
  work?: { title?: string; author?: string; medium?: string } | null
  quote?: { text?: string; source?: string } | null
}

export function matchEntry(e: SearchableEntry, q: string): boolean {
  if (!q) return true
  const hay = [
    e.title,
    e.summary,
    (e.tags || []).join(' '),
    e.game?.title,
    e.game?.studio,
    e.work?.title,
    e.work?.author,
    mediumName(e.work?.medium),
    markdownText(e.body),
    e.quote?.text,
    e.quote?.source,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}
