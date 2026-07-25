const categoryModules = import.meta.glob<string>('./categories/a*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
})

const noCategoryModules = import.meta.glob<string>(
  './categories/no_category.svg',
  {
    eager: true,
    import: 'default',
    query: '?url',
  }
)

/** ZenMoney `tag.icon` name to its monochrome category asset. */
export const categoryIconById = createCategoryIconMap(categoryModules)

/** Fallback used for the synthetic uncategorized tag. */
export const noCategoryIconUrl =
  noCategoryModules['./categories/no_category.svg']!

function createCategoryIconMap(
  modules: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, url]) => [
      path.slice('./categories/a'.length, -'.svg'.length),
      url,
    ])
  )
}
