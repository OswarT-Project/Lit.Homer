<script setup lang="ts">
const route = useRoute()
const { categoryNames, mediaNames } = await useTaxonomy()

const { data: series } = await useAsyncData(`series-${route.path}`, () => queryCollection('series').path(route.path).first())
if (!series.value) throw createError({ statusCode: 404, statusMessage: '没有找到这个专题', fatal: true })

const slug = slugOf(route.path)
const { data: members } = await useAsyncData(`series-members-${route.path}`, () =>
  queryCollection('entries').where('series', '=', slug).order('updated', 'DESC').all(),
)
const { data: titles } = await useAsyncData(`series-titles-${route.path}`, () => queryCollection('entries').select('title', 'path', 'stem').all())
const titleOf = (entrySlug: string) => titles.value?.find((e) => slugOf(e.path) === entrySlug)

const written = computed(() => series.value!.roster.filter((r) => r.entry).length)
const columns = [
  { accessorKey: 'name', header: '人物' },
  { accessorKey: 'work', header: '原典' },
  { accessorKey: 'author', header: '作者' },
  { accessorKey: 'medium', header: '媒介' },
  { accessorKey: 'note', header: '说明' },
  { accessorKey: 'entry', header: '考据' },
]
const rows = computed(() => series.value!.roster.map((r) => ({ ...r, medium: mediaNames.value[r.medium ?? 'book'] ?? r.medium })))

useSeoMeta({ title: () => series.value!.title, description: () => series.value!.description })
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader :headline="series!.eyebrow" :title="series!.title" :description="series!.description" />

    <section class="mt-8">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="font-serif text-xl font-semibold text-highlighted">原典对照</h2>
        <span class="text-sm text-muted">已写 {{ written }} / {{ series!.roster.length }}</span>
      </div>
      <UProgress :model-value="written" :max="Math.max(series!.roster.length, 1)" class="mb-4" />
      <UTable :data="rows" :columns="columns" class="rounded-lg border border-default">
        <template #entry-cell="{ row }">
          <NuxtLink v-if="row.original.entry" :to="`/entries/${row.original.entry}`" class="flex items-center gap-1.5 hover:underline">
            <UBadge label="已写" color="primary" variant="subtle" size="sm" />{{ titleOf(row.original.entry)?.title }}
          </NuxtLink>
          <UBadge v-else label="待写" color="neutral" variant="outline" size="sm" />
        </template>
      </UTable>
      <ContentRenderer v-if="series" :value="series" class="mt-3 text-sm text-muted" />
    </section>

    <section class="mt-12">
      <h2 class="mb-3 font-serif text-xl font-semibold text-highlighted">本专题条目</h2>
      <div v-if="members?.length" class="grid gap-4 md:grid-cols-2">
        <EntryRow v-for="e in members" :key="e.path" :entry="e" :categories="categoryNames" :media="mediaNames" />
      </div>
      <UEmpty v-else title="这个专题还没有条目" description="从议题板认领一个，写完就是第一条。" />
      <p class="mt-4 text-sm text-muted">怎么加进来？在条目的 frontmatter 里写 <code>series: {{ slug }}</code>。</p>
    </section>
  </UContainer>
</template>
