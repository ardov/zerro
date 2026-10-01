import { type ReactElement } from 'react'
import type { TTagId } from '@/6-shared/types'
import { Select } from '@/6-shared/ui/kit/Select'
import type { PreferredCategoryType } from './model'
import { useCategoryOptions } from './useCategoryOptions'

export type CategorySelectProps = {
  value?: TTagId
  onSelect: (id: TTagId) => void
  excludeIds?: readonly TTagId[]
  preferredType?: PreferredCategoryType
  trigger: ReactElement
}

export function CategorySelect(props: CategorySelectProps) {
  const { value, onSelect, excludeIds, preferredType, trigger } = props
  const options = useCategoryOptions({ value, excludeIds, preferredType })
  return (
    <Select
      {...options}
      value={value ?? null}
      clearable={false}
      onChange={onSelect}
      trigger={trigger}
    />
  )
}
