<script setup lang="ts">
const { data: topics } = await useAsyncData('topics-list', () => queryCollection('topics').order('updated', 'DESC').all())
const { data: entries } = await useAsyncData('topics-todo', () => queryCollection('entries').select('title', 'path', 'notes').all())

const statuses = ['征集', '整理中', '已完成'] as const
const byStatus = computed(() => statuses.map((s) => ({ status: s, items: (topics.value ?? []).filter((t) => t.status === s) })).filter((g) => g.items.length))
const todos = computed(() => (entries.value ?? []).flatMap((e) => e.notes.filter((n) => n.label === '待补').map((n) => ({ entry: e, text: n.text }))))

useSeoMeta({ title: '议题板', description: '还没查清的问题。讨论在群聊里发生，结论回填成条目。' })
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader title="议题板" description="还没查清的问题。讨论在群聊里发生，结论回填成条目——这里只负责把问题攒住。" />

    <section v-for="g in byStatus" :key="g.status" class="mt-8">
      <h2 class="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-highlighted">
        <UBadge :label="g.status" :color="statusColor(g.status)" variant="subtle" /> {{ g.items.length }}
      </h2>
      <div class="grid gap-3 md:grid-cols-2">
        <UPageCard v-for="t in g.items" :key="t.path" :to="t.path" :title="t.title" variant="outline">
          <template #description>
            <span class="line-clamp-2">{{ t.description || t.leads[0] }}</span>
          </template>
          <template #footer>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge v-for="x in t.tags" :key="x" :label="x" color="neutral" variant="soft" size="sm" />
              <UBadge :label="originLabel(t.origin)" :color="originColor(t.origin)" variant="subtle" size="sm" />
              <span class="ml-auto text-xs text-dimmed">{{ fmtDate(t.updated) }}</span>
            </div>
          </template>
        </UPageCard>
      </div>
    </section>

    <section class="mt-14">
      <h2 class="mb-1 font-serif text-lg font-semibold text-highlighted">各条目的待补（{{ todos.length }}）</h2>
      <p class="mb-3 text-sm text-muted">条目注记里标了「待补」的地方，认领一个就是一次贡献。</p>
      <ul class="divide-y divide-default rounded-lg border border-default">
        <li v-for="t in todos" :key="t.entry.path + t.text" class="px-4 py-2.5 text-sm">
          <NuxtLink :to="t.entry.path" class="font-serif font-semibold text-highlighted hover:underline">{{ t.entry.title }}</NuxtLink>
          <p class="text-muted">{{ t.text }}</p>
        </li>
      </ul>
    </section>
  </UContainer>
</template>
