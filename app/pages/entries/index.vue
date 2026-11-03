<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { categories, media, categoryNames, mediaNames } = await useTaxonomy()

const q = computed(() => String(route.query.q ?? '').trim())
const cat = computed(() => String(route.query.cat ?? ''))
const med = computed(() => String(route.query.m ?? ''))
const org = computed(() => String(route.query.o ?? ''))

const search = ref(q.value)
watch(q, (v) => (search.value = v))
watchDebounced(search, (v) => setQuery({ q: v.trim() || undefined }), { debounce: 250 })

function setQuery(patch: Record<string, string | undefined>) {
  router.replace({ query: { ...route.query, ...patch } })
}

const { data: entries } = await useAsyncData(
  'entries-list',
  () => {
    let query = queryCollection('entries').order('updated', 'DESC')
    if (cat.value) query = query.where('category', '=', cat.value)
    if (org.value) query = query.where('origin', '=', org.value)
    if (q.value) {
      const like = `%${q.value.replace(/[%_]/g, '')}%`
      query = query.orWhere((g) =>
        ['title', 'description', 'tags', 'game', 'work', 'quote'].reduce((acc, f) => acc.where(f, 'LIKE', like), g),
      )
    }
    return query.all()
  },
  { watch: [q, cat, org] },
)

const shown = computed(() => (entries.value ?? []).filter((e) => !med.value || (mediumTag(e) ?? 'book') === med.value))
const usedMedia = computed(() => media.value.filter((m) => m.id === 'book' || (entries.value ?? []).some((e) => (mediumTag(e) ?? 'book') === m.id)))

useSeoMeta({ title: '条目库', description: '按类别、门类、核实状态或关键词检索全部考据条目。' })
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader title="条目库" :description="`共 ${entries?.length ?? 0} 条考据。按游戏、著作、作者或关键词检索。`" />

    <div class="my-6 space-y-3">
      <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="搜索标题、游戏、著作、作者、关键词…" class="w-full max-w-xl" :ui="{ trailing: 'pe-1' }">
        <template v-if="search" #trailing>
          <UButton color="neutral" variant="link" size="sm" icon="i-heroicons-x-mark" aria-label="清除搜索" @click="search = ''" />
        </template>
      </UInput>

      <div class="flex flex-wrap items-center gap-2">
        <span class="w-12 text-xs text-muted">类别</span>
        <UButton :variant="cat ? 'outline' : 'solid'" color="neutral" size="xs" label="全部" @click="setQuery({ cat: undefined })" />
        <UButton v-for="c in categories" :key="c.id" :variant="cat === c.id ? 'solid' : 'outline'" :color="cat === c.id ? 'primary' : 'neutral'" size="xs" :label="c.name" @click="setQuery({ cat: c.id })" />
      </div>
      <div v-if="usedMedia.length > 1" class="flex flex-wrap items-center gap-2">
        <span class="w-12 text-xs text-muted">门类</span>
        <UButton :variant="med ? 'outline' : 'solid'" color="neutral" size="xs" label="全部" @click="setQuery({ m: undefined })" />
        <UButton v-for="m in usedMedia" :key="m.id" :variant="med === m.id ? 'solid' : 'outline'" :color="med === m.id ? 'primary' : 'neutral'" size="xs" :label="m.name" @click="setQuery({ m: m.id })" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-12 text-xs text-muted">状态</span>
        <UButton :variant="org ? 'outline' : 'solid'" color="neutral" size="xs" label="全部" @click="setQuery({ o: undefined })" />
        <UButton :variant="org === 'human' ? 'solid' : 'outline'" :color="org === 'human' ? 'primary' : 'neutral'" size="xs" label="成员撰写" @click="setQuery({ o: 'human' })" />
        <UButton :variant="org === 'ai' ? 'solid' : 'outline'" :color="org === 'ai' ? 'warning' : 'neutral'" size="xs" label="AI 草稿" @click="setQuery({ o: 'ai' })" />
      </div>
    </div>

    <p v-if="q" class="mb-4 text-sm text-muted">搜索「{{ q }}」：<b class="text-highlighted">{{ shown.length }}</b> 条结果</p>

    <div v-if="shown.length" class="grid gap-4 md:grid-cols-2">
      <EntryRow v-for="e in shown" :key="e.path" :entry="e" :categories="categoryNames" :media="mediaNames" />
    </div>
    <UEmpty v-else icon="i-heroicons-document" title="这里还是空的" description="换个关键词，或者——把这个空缺写成一条新考据。" :actions="[{ label: '如何添加条目', to: '/contribute' }]" />
  </UContainer>
</template>
