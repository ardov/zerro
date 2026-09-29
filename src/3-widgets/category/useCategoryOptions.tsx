import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTagId } from '@/6-shared/types'
import { CategoryIcon } from '@/6-shared/ui/CategoryIcon'
import type { SelectOption } from '@/6-shared/ui/kit/Select'
import type { SelectSearchOptions } from '@/6-shared/ui/kit/SelectSearch'
import { categoryChoices, type CategoryChoicesOptions } from './model'

/** Select props for categories. The option source is built once per category
 * set; search and hierarchy come from `categoryChoices`. */
export function useCategoryOptions(
  options: Omit<CategoryChoicesOptions, 'query'>
) {
  const { t } = useTranslation()
  const tags = useAppSelector(core.tags.selectPopulated)
  const { categories, items, byId } = useMemo(() => {
    const categories = Object.values(tags)
    const items = categories.map((category): SelectOption<TTagId> => ({
      value: category.id,
      label: category.name,
      start: (
        <CategoryIcon symbol={category.symbol} color={category.colorHEX} />
      ),
    }))
    const byId = new Map(items.map(item => [item.value, item]))
    return { categories, items, byId }
  }, [tags])
  const search: SelectSearchOptions<TTagId> = {
    label: t('selectCategory'),
    showMoreLabel: t('showAllCategories'),
    filter: (_, query, { expanded }) => {
      const { choices, hasMore } = categoryChoices(categories, {
        ...options,
        query,
        showAll: options.showAll || expanded,
      })
      return {
        items: choices.flatMap(({ category, indent }) => {
          const option = byId.get(category.id)
          return option ? [{ ...option, indent }] : []
        }),
        hasMore,
      }
    },
  }
  return {
    label: t('selectCategory'),
    items,
    search,
    emptyText: t('noCategoriesFound'),
    popupMinWidth: 280,
  }
}
