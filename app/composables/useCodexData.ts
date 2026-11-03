import type { Collections } from '#nuxt-content'

type Entry = Collections['entries']
type Topic = Collections['topics']
type Series = Collections['series']

function slugOf(item: { path?: string; stem?: string; id?: string }): string {
  const p = item.path || item.stem || item.id || ''
  return String(p).split('/').filter(Boolean).pop() || ''
}

/** 拉取三个集合（带共享缓存），并建立按 slug 的索引以解析跨引用。 */
export async function useCodexData() {
  const { data: entries } = await useAsyncData('codex-entries', () => queryCollection('entries').all())
  const { data: topics } = await useAsyncData('codex-topics', () => queryCollection('topics').all())
  const { data: series } = await useAsyncData('codex-series', () => queryCollection('series').all())

  const entryBySlug = computed(() => {
    const m = new Map<string, Entry>()
    for (const e of entries.value || []) m.set(slugOf(e), e)
    return m
  })

  const topicBySlug = computed(() => {
    const m = new Map<string, Topic>()
    for (const t of topics.value || []) m.set(slugOf(t), t)
    return m
  })

  const seriesBySlug = computed(() => {
    const m = new Map<string, Series>()
    for (const s of series.value || []) m.set(slugOf(s), s)
    return m
  })

  return { entries, topics, series, entryBySlug, topicBySlug, seriesBySlug, slugOf }
}
