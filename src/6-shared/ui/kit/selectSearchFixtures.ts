import type { SelectItem, SelectOption } from './Select'
import type { SelectSearchOptions } from './SelectCombobox'

/** Story fixture: prefer active bank accounts; search includes every account. */
export const accountSearch: SelectSearchOptions<string> = {
  showMoreLabel: 'Show all accounts',
  filter: (source, query, { expanded }) => {
    const normalize = (value: string) =>
      value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    const search = normalize(query.trim())
    let hasMore = false
    const matches = (item: SelectOption) => {
      if (search)
        return [item.label, ...(item.keywords ?? [])].some(value =>
          normalize(value).includes(search)
        )
      const preferred = item.value === 'daily' || item.value === 'savings'
      if (!preferred && !expanded) hasMore = true
      return expanded || preferred
    }
    const items: SelectItem[] = source.flatMap<SelectItem>(item => {
      if (!('type' in item)) return matches(item) ? [item] : []
      if (item.type === 'separator') return [item]
      return [{ ...item, items: item.items.filter(matches) }]
    })
    return { items, hasMore }
  },
}
