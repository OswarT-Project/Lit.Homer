<script setup lang="ts">
import type { EntriesCollectionItem } from '@nuxt/content'

defineProps<{ entry: EntriesCollectionItem; categories?: Record<string, string>; media?: Record<string, string> }>()
</script>

<template>
  <UPageCard :to="entry.path" variant="outline" :ui="{ container: 'gap-y-2 p-4 sm:p-5' }">
    <template #body>
      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge :label="categories?.[entry.category] ?? '未分类'" :color="categories?.[entry.category] ? 'neutral' : 'error'" variant="outline" size="sm" />
        <UBadge v-if="entry.relation" :label="entry.relation" :color="relationColor(entry.relation)" variant="subtle" size="sm" />
        <UBadge v-if="mediumTag(entry)" :label="media?.[mediumTag(entry)!] ?? mediumTag(entry)" variant="outline" color="neutral" size="sm" />
        <UBadge :label="originLabel(entry.origin)" :color="originColor(entry.origin)" variant="subtle" size="sm" />
        <span class="ml-auto text-xs text-dimmed">{{ fmtDate(entry.updated) }}</span>
      </div>

      <p class="mt-1 font-serif text-base font-semibold text-highlighted">
        <template v-if="entry.game.title === entry.work.title">
          {{ entry.game.title }}
          <span class="ml-1 font-sans text-sm font-normal text-primary">· {{ media?.[entry.game.medium ?? 'book'] ?? '' }}改编</span>
        </template>
        <template v-else>
          {{ entry.game.title }}
          <span class="mx-1 font-sans text-sm font-normal text-primary">{{ entry.relation ?? '×' }}</span>
          {{ entry.work.title }}
        </template>
      </p>

      <blockquote v-if="entry.quote" class="border-l-2 border-primary pl-3 font-serif text-sm text-toned">
        「{{ entry.quote.text }}」
      </blockquote>
      <p class="text-sm text-muted">{{ entry.description }}</p>
    </template>
  </UPageCard>
</template>
