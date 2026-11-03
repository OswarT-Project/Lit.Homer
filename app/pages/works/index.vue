<script setup lang="ts">
const { data: entries } = await useAsyncData('works-entries', () =>
  queryCollection('entries').select('title', 'path', 'game', 'work', 'category').all(),
)
const { data: series } = await useAsyncData('works-series', () => queryCollection('series').all())

const tab = ref<'works' | 'games'>('works')

interface Group { name: string; sub: string; entries: { title: string; path: string }[]; roster: string[] }

function group(side: 'work' | 'game'): Group[] {
  const map = new Map<string, Group>()
  for (const e of entries.value ?? []) {
    const k = e[side].title
    const sub = side === 'work' ? (e.work.author ?? '') : (e.game.studio ?? '')
    if (!map.has(k)) map.set(k, { name: k, sub, entries: [], roster: [] })
    map.get(k)!.entries.push({ title: e.title, path: e.path })
  }
  if (side === 'work') {
    for (const s of series.value ?? []) {
      for (const r of s.roster) {
        if (!map.has(r.work)) map.set(r.work, { name: r.work, sub: r.author, entries: [], roster: [] })
        map.get(r.work)!.roster.push(`${s.short} · ${r.name}`)
      }
    }
  }
  return [...map.values()].sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, 'zh'))
}

const groups = computed(() => group(tab.value === 'works' ? 'work' : 'game'))

useSeoMeta({ title: '索引', description: '按原典或游戏查看所有相关条目。' })
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader title="索引" description="同一部原典、同一款游戏被写过几次？专题名册里列出、但还没有条目的原典也在这里。" />
    <UTabs v-model="tab" :items="[{ label: '原典', value: 'works' }, { label: '游戏', value: 'games' }]" :content="false" class="my-6 max-w-xs" />

    <ul class="divide-y divide-default rounded-lg border border-default">
      <li v-for="g in groups" :key="g.name" class="px-4 py-3">
        <div class="flex flex-wrap items-baseline gap-2">
          <span class="font-serif text-lg font-semibold text-highlighted">{{ g.name }}</span>
          <span class="text-sm text-muted">{{ g.sub }}</span>
          <UBadge :label="`${g.entries.length} 条`" :color="g.entries.length ? 'primary' : 'neutral'" variant="subtle" size="sm" class="ml-auto" />
        </div>
        <ul v-if="g.entries.length" class="mt-1 space-y-0.5 text-sm">
          <li v-for="e in g.entries" :key="e.path"><NuxtLink :to="e.path" class="hover:underline">{{ e.title }}</NuxtLink></li>
        </ul>
        <p v-if="g.roster.length" class="mt-1 text-xs text-muted">专题名册：{{ g.roster.join('；') }}</p>
      </li>
    </ul>
  </UContainer>
</template>
