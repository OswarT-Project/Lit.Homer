<script setup lang="ts">
const route = useRoute()
const { categoryNames, mediaNames } = await useTaxonomy()

const { data: topic } = await useAsyncData(`topic-${route.path}`, () => queryCollection('topics').path(route.path).first())
if (!topic.value) throw createError({ statusCode: 404, statusMessage: '没有找到这个议题', fatal: true })

const { data: related } = await useAsyncData(`topic-rel-${route.path}`, () => {
  const paths = (topic.value!.entries ?? []).map((s) => `/entries/${s}`)
  return paths.length ? queryCollection('entries').where('path', 'IN', paths).all() : Promise.resolve([])
})

useSeoMeta({ title: () => topic.value!.title, description: () => topic.value!.description })
</script>

<template>
  <UContainer class="max-w-3xl py-10">
    <div class="mb-3 flex flex-wrap items-center gap-1.5">
      <UBadge :label="topic!.status" :color="statusColor(topic!.status)" variant="subtle" />
      <UBadge v-for="t in topic!.tags" :key="t" :label="t" color="neutral" variant="soft" />
      <UBadge :label="originLabel(topic!.origin)" :color="originColor(topic!.origin)" variant="subtle" />
    </div>
    <h1 class="font-serif text-3xl font-semibold leading-snug text-highlighted">{{ topic!.title }}</h1>
    <p class="mt-1 text-xs text-dimmed">最后整理 {{ fmtDate(topic!.updated) }}</p>

    <ContentRenderer v-if="topic" :value="topic" class="mt-6" />

    <section v-if="topic!.leads.length" class="mt-8">
      <h2 class="mb-2 font-serif text-xl font-semibold text-highlighted">可以这样入手</h2>
      <ol class="list-decimal space-y-2 pl-5 text-muted">
        <li v-for="l in topic!.leads" :key="l">{{ l }}</li>
      </ol>
    </section>

    <section v-if="related?.length" class="mt-10">
      <h2 class="mb-3 font-serif text-xl font-semibold text-highlighted">相关条目</h2>
      <div class="grid gap-3">
        <EntryRow v-for="e in related" :key="e.path" :entry="e" :categories="categoryNames" :media="mediaNames" />
      </div>
    </section>

    <UAlert class="mt-10" color="neutral" variant="subtle" icon="i-heroicons-light-bulb" title="结论写完了？"
      description="把它变成条目：在 content/entries/ 新建一个 Markdown 文件，或在 Nuxt Studio 里添加。" :actions="[{ label: '添加条目', to: '/contribute', color: 'neutral', variant: 'outline' }]" />
  </UContainer>
</template>
