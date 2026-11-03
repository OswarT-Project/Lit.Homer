export const slugOf = (path: string) => path.split('/').filter(Boolean).pop() ?? ''

export const originLabel = (origin?: string) => (origin === 'human' ? '成员撰写' : 'AI 草稿 · 待核实')
export const originColor = (origin?: string) => (origin === 'human' ? 'primary' : 'warning') as 'primary' | 'warning'

export const statusColor = (status: string) =>
  ({ 征集: 'warning', 整理中: 'info', 已完成: 'success' }[status] ?? 'neutral') as 'warning' | 'info' | 'success' | 'neutral'

export const relationColor = (relation?: string) =>
  ({ 引用: 'primary', 化用: 'info', 同源: 'neutral' }[relation ?? ''] ?? 'neutral') as 'primary' | 'info' | 'neutral'

/** 游戏侧的标签：整条以电影等为主时，字段名随之改变。 */
export function gameSide(medium?: string) {
  const m = { film: ['影片', '导演'], tv: ['剧集', '主创'], play: ['剧目', '编剧'] }[medium ?? '']
  return { side: m?.[0] ?? '游戏', credit: m?.[1] ?? '制作' }
}

export const fmtDate = (d?: string | Date) => (d ? new Date(d).toISOString().slice(0, 10).replaceAll('-', '.') : '')

/** 卡片上该标的媒介：优先看「游戏」侧的异常媒介，否则看「作品」侧是否不是书。 */
export const mediumTag = (e: { game?: { medium?: string }; work?: { medium?: string } }) =>
  e.game?.medium || (e.work?.medium !== 'book' ? e.work?.medium : undefined)
