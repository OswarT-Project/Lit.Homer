<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp>
    <UMain>
      <UError :error="error" :clear="{ label: '回到条目库', to: '/entries' }" />
    </UMain>
  </UApp>
</template>
