<script setup lang="ts">
const { categoryNames, mediaNames } = await useTaxonomy()

const { data: landing } = await useAsyncData('landing', () => queryCollection('landing').first())
const { data: recent } = await useAsyncData('home-recent', () => queryCollection('entries').order('updated', 'DESC').limit(4).all())
const { data: all } = await useAsyncData('home-all', () => queryCollection('entries').select('origin', 'path').all())
const { data: topics } = await useAsyncData('home-topics', () =>
  queryCollection('topics').select('title', 'path', 'status', 'updated').where('status', '=', '征集').order('updated', 'DESC').all(),
)
const { data: series } = await useAsyncData('home-series', () => queryCollection('series').all())
const { data: todo } = await useAsyncData('home-todo-count', async () => {
  const rows = await queryCollection('entries').select('notes').all()
  return rows.reduce((n, e) => n + (e.notes ?? []).filter((x) => x.label === '待补').length, 0)
})

const total = computed(() => all.value?.length ?? 0)
const human = computed(() => (all.value ?? []).filter((e) => e.origin === 'human').length)

useSeoMeta({ title: () => `${landing.value?.title} · ${landing.value?.subtitle}`, description: () => landing.value?.tagline })
</script>

<template>
  <div>
    <UPageHero :title="`${landing?.title} · ${landing?.subtitle}`" :description="landing?.tagline" :headline="landing?.club" :ui="{ container: 'py-14 sm:py-16 lg:py-20 gap-10' }"
      :links="[{ label: '进入条目库', to: '/entries', size: 'lg' }, { label: '看议题板', to: '/topics', color: 'neutral', variant: 'outline', size: 'lg' }]">
      <template #default>
        <p class="mx-auto max-w-2xl text-sm leading-relaxed text-muted">{{ landing?.intro }}</p>
      </template>
    </UPageHero>

    <UContainer class="space-y-14 pb-16">
      <section>
        <div class="mb-2 flex items-baseline justify-between text-sm">
          <h2 class="font-serif text-lg font-semibold text-highlighted">核实进度</h2>
          <span class="text-muted">成员撰写 <b class="text-highlighted">{{ human }}</b> / {{ total }} · 待补 {{ todo }} 处 · 议题 {{ topics?.length }} 个征集中</span>
        </div>
        <UProgress :model-value="human" :max="Math.max(total, 1)" color="primary" />
        <p class="mt-2 text-xs text-muted">每一条从「AI 草稿」变成「成员撰写」，才算真正完成。</p>
      </section>

      <section>
        <div class="mb-4 flex items-baseline justify-between">
          <h2 class="font-serif text-xl font-semibold text-highlighted">最近更新</h2>
          <ULink to="/entries" class="text-sm text-primary">全部条目 →</ULink>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <EntryRow v-for="e in recent" :key="e.path" :entry="e" :categories="categoryNames" :media="mediaNames" />
        </div>
      </section>

      <section v-if="topics?.length">
        <div class="mb-4 flex items-baseline justify-between">
          <h2 class="font-serif text-xl font-semibold text-highlighted">等人来查的问题</h2>
          <ULink to="/topics" class="text-sm text-primary">议题板 →</ULink>
        </div>
        <ul class="divide-y divide-default rounded-lg border border-default">
          <li v-for="t in topics.slice(0, 4)" :key="t.path">
            <NuxtLink :to="t.path" class="flex items-center gap-3 px-4 py-3 hover:bg-elevated">
              <UBadge :label="t.status" :color="statusColor(t.status)" variant="subtle" size="sm" />
              <span class="font-serif text-highlighted">{{ t.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="series?.length">
        <h2 class="mb-4 font-serif text-xl font-semibold text-highlighted">专题</h2>
        <UPageGrid>
          <UPageCard v-for="s in series" :key="s.path" :to="s.path" :title="s.title" :description="s.description" variant="outline">
            <template #footer>
              <span class="text-sm text-muted">
                原典对照 已写 {{ s.roster.filter((r) => r.entry).length }} / {{ s.roster.length }}
              </span>
            </template>
          </UPageCard>
        </UPageGrid>
      </section>
    </UContainer>
  </div>
</template>
