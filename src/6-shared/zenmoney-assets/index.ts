const categoryModules = import.meta.glob<string>('./categories/a*.svg', {
  eager: true,
  import: 'default',
  query: '?inline',
})

/** Zenmoney `tag.icon` name to its monochrome category asset. */
export const categoryIconById = createCategoryIconMap(categoryModules)

/** Fallback used for the synthetic uncategorized tag. */
export { default as noCategoryIconUrl } from './categories/no_category.svg?inline'

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
