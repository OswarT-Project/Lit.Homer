<script setup lang="ts">
const { data: series } = await useAsyncData('series-list', () => queryCollection('series').all())
const { data: entries } = await useAsyncData('series-counts', () => queryCollection('entries').select('series').all())
const count = (slug: string) => (entries.value ?? []).filter((e) => e.series === slug).length

useSeoMeta({ title: '专题', description: '围绕一个游戏、一部作品或一位作者聚起来的若干条目。' })
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader title="专题" description="围绕一个游戏、一部作品或一位作者聚起来的若干条目。" />
    <UPageGrid class="mt-8">
      <UPageCard v-for="s in series" :key="s.path" :to="s.path" :title="s.title" :description="s.description" :headline="s.eyebrow" variant="outline">
        <template #footer>
          <div class="flex items-center gap-3 text-sm text-muted">
            <span>原典对照 已写 {{ s.roster.filter((r) => r.entry).length }} / {{ s.roster.length }}</span>
            <span>· {{ count(slugOf(s.path)) }} 条考据</span>
          </div>
          <UProgress :model-value="s.roster.filter((r) => r.entry).length" :max="Math.max(s.roster.length, 1)" size="sm" class="mt-2" />
        </template>
      </UPageCard>
    </UPageGrid>
  </UContainer>
</template>
