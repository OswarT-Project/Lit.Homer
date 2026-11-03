// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    'nuxt-studio',
    '@vueuse/nuxt/module',
    'nuxt-auth-utils',
    '@type32/nuxt-cs-utils',
    '@type32/nuxt-ui-extras',
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-04-03',
})
