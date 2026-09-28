import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTagId } from '@/6-shared/types'
import { Select } from '@/6-shared/ui/kit/Select'
import type { PreferredCategoryType } from './model'
import { filterCategoryOptions, toCategoryOption } from './categoryOption'

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
      items={categories.map(toCategoryOption)}
      emptyText={t('noCategoriesFound')}
      search={{
        label: t('selectCategory'),
        showMoreLabel: t('showAllCategories'),
        filter: (source, query, { expanded }) =>
          filterCategoryOptions(source, categories, {
            value,
            excludeIds,
            preferredType,
            query,
            showAll: expanded,
          }),
      }}
    />
  )
}
