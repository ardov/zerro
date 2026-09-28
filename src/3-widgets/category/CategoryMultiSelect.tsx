import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { PopupController } from '@/6-shared/overlays'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import type { TTagId } from '@/6-shared/types'
import { filterCategoryOptions, toCategoryOption } from './categoryOption'

export type CategoryMultiSelectProps = {
  value: TTagId[]
  onChange: (ids: TTagId[]) => void
  trigger: ReactElement
  popup?: PopupController
}

export function CategoryMultiSelect(props: CategoryMultiSelectProps) {
  const { value, onChange, trigger, popup } = props
  const { t } = useTranslation()
  const tags = useAppSelector(core.tags.selectPopulated)
  const categories = Object.values(tags)
  return (
    <MultiSelect
      value={value}
      onChange={onChange}
      trigger={trigger}
      popup={popup}
      label={t('selectCategory')}
      popupMinWidth={280}
      items={categories.map(toCategoryOption)}
      emptyText={t('noCategoriesFound')}
      search={{
        label: t('selectCategory'),
        filter: (source, query) =>
          filterCategoryOptions(source, categories, {
            query,
            showAll: true,
            includeUncategorized: true,
          }),
      }}
    />
  )
}
