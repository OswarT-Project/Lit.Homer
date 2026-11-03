<script setup lang="ts">
const route = useRoute()

const { data: landing } = await useAsyncData('landing', () => queryCollection('landing').first())

const { data: navigation } = await useAsyncData('search-navigation', async () => {
  const [entries, topics] = await Promise.all([queryCollectionNavigation('entries'), queryCollectionNavigation('topics')])
  const titles: Record<string, string> = { '/entries': '条目', '/topics': '议题' }
  return [...entries, ...topics].map((n) => ({ ...n, title: titles[n.path] ?? n.title }))
})

const { data: files } = useLazyAsyncData(
  'search-sections',
  async () => {
    const [entries, topics] = await Promise.all([
      queryCollectionSearchSections('entries'),
      queryCollectionSearchSections('topics'),
    ])
    return [...entries, ...topics]
  },
  { server: false },
)

const items = computed(() => [
  { label: '条目', to: '/entries', active: route.path.startsWith('/entries') },
  { label: '议题', to: '/topics', active: route.path.startsWith('/topics') },
  { label: '专题', to: '/series', active: route.path.startsWith('/series') },
  { label: '索引', to: '/works', active: route.path.startsWith('/works') },
  { label: '关于', to: '/about', active: route.path === '/about' || route.path === '/contribute' },
])
</script>

<template>
  <NuxtRouteAnnouncer />
  <UApp>
    <UHeader :title="landing?.title">
      <template #title>
        <span class="font-serif text-xl font-semibold tracking-wide">{{ landing?.title }}</span>
        <span class="ml-2 hidden text-sm text-muted sm:inline">{{ landing?.subtitle }}</span>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UContentSearchButton class="hidden sm:flex" label="搜索条目与议题" />
        <UContentSearchButton class="sm:hidden" :collapsed="true" />
        <UColorModeButton />
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          {{ landing?.title }} · {{ landing?.subtitle }} · <NuxtLink to="/contribute" class="underline">如何添加条目</NuxtLink>
        </p>
      </template>
      <template #right>
        <p class="text-sm text-muted">
          <UBadge label="AI 草稿" color="warning" variant="subtle" size="sm" /> 尚未经成员核实
          <UBadge label="成员撰写" color="primary" variant="subtle" size="sm" class="ml-2" /> 由成员负责
        </p>
      </template>
    </UFooter>

    <ClientOnly>
      <LazyUContentSearch :files="files || []" :navigation="navigation || []" :fuse="{ resultLimit: 30, fuseOptions: { useTokenSearch: false, threshold: 0.2, ignoreLocation: true, keys: ['label', 'description', 'suffix', 'title', 'content'] } }" shortcut="meta_k" />
    </ClientOnly>
  </UApp>
</template>
