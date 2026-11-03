<script setup lang="ts">
const route = useRoute()
const { categoryNames, mediaNames } = await useTaxonomy()

const { data: entry } = await useAsyncData(`entry-${route.path}`, () => queryCollection('entries').path(route.path).first())
if (!entry.value) throw createError({ statusCode: 404, statusMessage: '没有找到这条考据', fatal: true })

const slug = slugOf(route.path)

const { data: surround } = await useAsyncData(`surround-${route.path}`, () =>
  queryCollectionItemSurroundings('entries', route.path, { fields: ['title', 'description'] }).order('updated', 'DESC'),
)

const { data: picked } = await useAsyncData(`picked-${route.path}`, () => {
  const paths = (entry.value!.related ?? []).map((s) => `/entries/${s}`)
  return paths.length ? queryCollection('entries').where('path', 'IN', paths).all() : Promise.resolve([])
})

const { data: index } = await useAsyncData('entries-index', () =>
  queryCollection('entries').select('title', 'path', 'category', 'game', 'work', 'updated', 'origin', 'description', 'quote', 'relation').all(),
)
const sameWork = computed(() => (index.value ?? []).filter((e) => e.path !== route.path && e.work.title === entry.value!.work.title))
const sameGame = computed(() => (index.value ?? []).filter((e) => e.path !== route.path && e.game.title === entry.value!.game.title))
const pickedPaths = computed(() => new Set((picked.value ?? []).map((e) => e.path)))
const autoRelated = computed(() => [...sameWork.value, ...sameGame.value].filter((e, i, a) => a.findIndex((x) => x.path === e.path) === i && !pickedPaths.value.has(e.path)))

const { data: series } = await useAsyncData(`series-${route.path}`, () =>
  entry.value!.series ? queryCollection('series').path(`/series/${entry.value!.series}`).first() : Promise.resolve(null),
)
const { data: topics } = await useAsyncData(`topics-${route.path}`, async () =>
  (await queryCollection('topics').select('title', 'path', 'status', 'entries').all()).filter((t) => (t.entries ?? []).includes(slug)),
)

const side = computed(() => gameSide(entry.value!.game.medium))
const todo = computed(() => entry.value!.notes.filter((n) => n.label === '待补'))
const notes = computed(() => entry.value!.notes.filter((n) => n.label !== '待补'))
const seat = computed(() => series.value?.roster.findIndex((r) => r.entry === slug) ?? -1)
const written = computed(() => series.value?.roster.filter((r) => r.entry).length ?? 0)

useSeoMeta({ title: () => entry.value!.title, description: () => entry.value!.description })
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-3 flex flex-wrap items-center gap-1.5">
      <UBadge :label="categoryNames[entry!.category] ?? '未分类'" :color="categoryNames[entry!.category] ? 'neutral' : 'error'" variant="outline" />
      <UBadge v-if="entry!.relation" :label="entry!.relation" :color="relationColor(entry!.relation)" variant="subtle" />
      <UBadge :label="originLabel(entry!.origin)" :color="originColor(entry!.origin)" variant="subtle" />
      <UBadge v-for="t in entry!.tags" :key="t" :label="t" color="neutral" variant="soft" />
    </div>
    <h1 class="font-serif text-3xl font-semibold leading-snug text-highlighted">{{ entry!.title }}</h1>
    <p class="mt-2 max-w-3xl text-muted">{{ entry!.description }}</p>
    <p class="mt-1 text-xs text-dimmed">最后整理 {{ fmtDate(entry!.updated) }}</p>

    <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article class="min-w-0">
        <div class="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted">{{ side.side }}<template v-if="entry!.game.medium"> · {{ mediaNames[entry!.game.medium] }}</template></p>
            <p class="font-serif text-lg font-semibold text-highlighted">{{ entry!.game.title }}</p>
            <p class="text-xs text-muted">{{ [entry!.game.year, entry!.game.studio].filter(Boolean).join(' · ') }}</p>
          </UCard>
          <div class="flex flex-col items-center text-primary">
            <span class="text-xs">{{ entry!.relation ?? '' }}</span>
            <UIcon name="i-heroicons-arrow-right" class="size-5 rotate-90 sm:rotate-0" />
          </div>
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted">原典 · {{ mediaNames[entry!.work.medium ?? 'book'] }}</p>
            <p class="font-serif text-lg font-semibold text-highlighted">{{ entry!.work.title }}</p>
            <p class="text-xs text-muted">{{ [entry!.work.author, entry!.work.year].filter(Boolean).join(' · ') }}</p>
          </UCard>
        </div>

        <figure v-if="entry!.quote" class="my-8 border-l-4 border-primary bg-elevated/50 py-4 pl-5 pr-4">
          <blockquote class="font-serif text-lg leading-relaxed text-highlighted">「{{ entry!.quote.text }}」</blockquote>
          <p v-if="entry!.quote.original" lang="und" class="mt-2 text-sm italic text-toned">{{ entry!.quote.original }}</p>
          <figcaption class="mt-2 text-sm text-muted">
            <UBadge v-if="entry!.quote.lang" :label="entry!.quote.lang" color="neutral" variant="outline" size="sm" class="mr-2" />{{ entry!.quote.source }}
          </figcaption>
          <p v-if="entry!.quote.note" class="mt-1 text-xs text-muted">{{ entry!.quote.note }}</p>
        </figure>

        <ContentRenderer v-if="entry" :value="entry" class="prose-body" />

        <section v-if="picked?.length || autoRelated.length" class="mt-12 space-y-3">
          <h2 class="font-serif text-xl font-semibold text-highlighted">相关条目</h2>
          <p v-if="sameWork.length" class="text-xs text-muted">同一原典《{{ entry!.work.title }}》</p>
          <div class="grid gap-3 md:grid-cols-2">
            <EntryRow v-for="e in [...(picked ?? []), ...autoRelated]" :key="e.path" :entry="e as any" :categories="categoryNames" :media="mediaNames" />
          </div>
        </section>

        <UContentSurround :surround="(surround as any) ?? []" class="mt-12" />
      </article>

      <aside class="space-y-6 text-sm lg:sticky lg:top-24 lg:self-start">
        <section v-if="notes.length || todo.length">
          <h2 class="mb-2 font-serif text-base font-semibold text-highlighted">注记</h2>
          <div class="space-y-2">
            <UCard v-for="n in notes" :key="n.label + n.text" :ui="{ body: 'p-3 sm:p-3' }">
              <p class="text-xs text-muted">{{ n.label }}</p>
              <p>{{ n.text }}</p>
            </UCard>
            <UAlert v-for="n in todo" :key="n.text" color="warning" variant="subtle" title="待补" :description="n.text" icon="i-heroicons-exclamation-triangle" />
          </div>
        </section>

        <section v-if="series">
          <h2 class="mb-2 font-serif text-base font-semibold text-highlighted">专题 · {{ series.short }}</h2>
          <p class="mb-2 text-xs text-muted">原典对照 已写 {{ written }} / {{ series.roster.length }}<template v-if="seat >= 0"> · 第 {{ seat + 1 }} 位 {{ series.roster[seat]!.name }}（本条）</template></p>
          <div class="flex flex-wrap gap-1">
            <UTooltip v-for="(r, i) in series.roster" :key="r.name" :text="`${r.name} · ${r.work}`">
              <NuxtLink :to="r.entry ? `/entries/${r.entry}` : series.path" class="block size-4 rounded-sm border" :class="i === seat ? 'border-primary bg-primary' : r.entry ? 'border-primary bg-primary/40' : 'border-default'" />
            </UTooltip>
          </div>
          <ULink :to="series.path" class="mt-2 inline-block text-xs text-primary">查看专题 →</ULink>
        </section>

        <section v-if="topics?.length">
          <h2 class="mb-2 font-serif text-base font-semibold text-highlighted">相关议题</h2>
          <ul class="space-y-2">
            <li v-for="t in topics" :key="t.path">
              <NuxtLink :to="t.path" class="flex items-start gap-2 hover:underline">
                <UBadge :label="t.status" :color="statusColor(t.status)" variant="subtle" size="sm" class="mt-0.5 shrink-0" />{{ t.title }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </UContainer>
</template>
