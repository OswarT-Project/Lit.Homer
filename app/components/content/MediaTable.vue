<script setup lang="ts">
const { data: media } = await useAsyncData('media-table', async () =>
  (await queryCollection('media').order('order', 'ASC').all()).map((m) => ({
    art: m.art,
    id: m.stem.split('/').pop(),
    num: m.num || '—',
    name: m.name,
  })),
)

const columns = [
  { accessorKey: 'art', header: '门类' },
  { accessorKey: 'id', header: '站内写法' },
  { accessorKey: 'num', header: '编号' },
  { accessorKey: 'name', header: '说明' },
]
const rows = computed(() => [{ art: '游戏', id: 'game', num: '第九艺术', name: '本档案的主语，走 game 字段，不占 medium' }, ...(media.value ?? [])])
</script>

<template>
  <UTable :data="rows" :columns="columns" class="my-6 rounded-lg border border-default" />
</template>
