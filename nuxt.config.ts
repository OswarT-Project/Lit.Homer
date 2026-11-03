// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    'nuxt-studio',
    '@vueuse/nuxt/module',
    'nuxt-auth-utils',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
})
