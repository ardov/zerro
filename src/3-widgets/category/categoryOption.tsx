import { CategoryIcon } from '@/6-shared/ui/CategoryIcon'
import type { SelectItem, SelectOption } from '@/6-shared/ui/kit/Select'
import {
  categoryChoices,
  type Category,
  type CategoryChoicesOptions,
} from './model'

/** Category label, search keywords, and decorative icon for select options. */
export function toCategoryOption(
  category: Category & { symbol: string; colorHEX?: string | null }
): SelectOption {
  return {
    value: category.id,
    label: category.name,
    keywords: [category.title],
    start: <CategoryIcon symbol={category.symbol} color={category.colorHEX} />,
  }
}

/** Apply category search and hierarchy to the select's complete option source. */
export function filterCategoryOptions(
  source: readonly SelectItem[],
  categories: readonly Category[],
  options: CategoryChoicesOptions
) {
  const byId = new Map(
    source.flatMap(item =>
      'type' in item ? [] : [[item.value, item] as const]
    )
  )
  const { choices, hasMore } = categoryChoices(categories, options)
  return {
    items: choices.flatMap(({ category, indent }) => {
      const option = byId.get(category.id)
      return option ? [{ ...option, indent }] : []
    }),
    hasMore,
  }
}
