import { primaryMedium, matchEntry, sortByUpdated } from '~/lib/codex'

/** 按当前路由的 ?cat=&m=&q= 筛选条目（搜索命中时保持更新序，否则按更新倒序）。 */
export function useEntryFilters() {
  const { entries } = useCodexData()
  const route = useRoute()

  const q = computed(() => String(route.query.q || '').trim().toLowerCase())
  const cat = computed(() => String(route.query.cat || ''))
  const media = computed(() => String(route.query.m || ''))

  const filtered = computed(() => {
    let list = entries.value || []
    if (cat.value) list = list.filter((e) => e.category === cat.value)
    if (media.value) list = list.filter((e) => primaryMedium(e) === media.value)
    if (q.value) list = list.filter((e) => matchEntry(e, q.value))
    return q.value ? list : sortByUpdated(list)
  })

  return { q, cat, media, filtered }
}
