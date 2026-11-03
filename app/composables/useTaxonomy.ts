/** 类别与媒介：来自 content/categories、content/media，文件名即 id。 */
export async function useTaxonomy() {
  const { data } = await useAsyncData('taxonomy', async () => {
    const [categories, media] = await Promise.all([
      queryCollection('categories').order('order', 'ASC').all(),
      queryCollection('media').order('order', 'ASC').all(),
    ])
    const id = (x: { stem: string }) => x.stem.split('/').pop()!
    return {
      categories: categories.map((c) => ({ id: id(c), name: c.name, description: c.description })),
      media: media.map((m) => ({ id: id(m), name: m.name })),
    }
  })
  const categories = computed(() => data.value?.categories ?? [])
  const media = computed(() => data.value?.media ?? [])
  return {
    categories,
    media,
    categoryNames: computed(() => Object.fromEntries(categories.value.map((c) => [c.id, c.name]))),
    mediaNames: computed(() => Object.fromEntries(media.value.map((m) => [m.id, m.name]))),
  }
}
