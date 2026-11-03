<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(`page-${route.path}`, () => queryCollection('pages').path(route.path).first())
if (!page.value) throw createError({ statusCode: 404, statusMessage: '这个地址不存在', fatal: true })

useSeoMeta({ title: () => page.value!.title, description: () => page.value!.description })
</script>

<template>
  <UContainer class="max-w-3xl py-10">
    <UPageHeader :title="page!.title" :description="page!.description" />
    <ContentRenderer v-if="page" :value="page" class="mt-8" />
  </UContainer>
</template>
