import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTagId } from '@/6-shared/types'
import { Select, type SelectOption } from '@/6-shared/ui/kit/Select'
import {
  categoryChoices,
  type Category,
  type PreferredCategoryType,
} from './model'
import { CategoryIcon } from '@/6-shared/ui/CategoryIcon'

export type CategorySelectProps = {
  value?: TTagId
  onSelect: (id: TTagId) => void
  excludeIds?: readonly TTagId[]
  preferredType?: PreferredCategoryType
  trigger: ReactElement
}

export function CategorySelect(props: CategorySelectProps) {
  const { value, onSelect, excludeIds, preferredType, trigger } = props
  const { t } = useTranslation()
  const tags = useAppSelector(core.tags.selectPopulated)
  const categories = Object.values(tags)
  return (
    <Select
      label={t('selectCategory')}
      value={value ?? null}
      onChange={id => {
        if (id !== null) onSelect(id)
      }}
      trigger={trigger}
      popupMinWidth={280}
      items={categories
        .filter(category => category.id !== core.tags.nullTag.id)
        .map(category => toCategoryOption(category))}
      emptyText={t('noCategoriesFound')}
      search={{
        label: t('selectCategory'),
        showMoreLabel: t('showAllCategories'),
        filter: (source, query, { expanded }) => {
          const optionsById = new Map(
            source.flatMap(item =>
              'type' in item ? [] : [[item.value, item] as const]
            )
          )
          const { choices, hasMore } = categoryChoices(categories, {
            value,
            excludeIds,
            preferredType,
            query,
            showAll: expanded,
          })
          return {
            items: choices.flatMap(({ category, indent }) => {
              const option = optionsById.get(category.id)
              return option ? [{ ...option, indent }] : []
            }),
            hasMore,
          }
        },
      }}
    />
  )
}

/** Category label, search keywords, and decorative icon for select options. */
function toCategoryOption(
  category: Category & { symbol: string; colorHEX?: string | null }
): SelectOption {
  return {
    value: category.id,
    label: category.name,
    keywords: [category.title],
    start: <CategoryIcon symbol={category.symbol} color={category.colorHEX} />,
  }
}
