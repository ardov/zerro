import type { ReactElement } from 'react'
import type { PopupController } from '@/6-shared/overlays'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import type { TTagId } from '@/6-shared/types'
import { useCategoryOptions } from './useCategoryOptions'

export type CategoryMultiSelectProps = {
  value: TTagId[]
  onChange: (ids: TTagId[]) => void
  trigger: ReactElement
  popup?: PopupController
}

export function CategoryMultiSelect(props: CategoryMultiSelectProps) {
  const { value, onChange, trigger, popup } = props
  const options = useCategoryOptions({
    showAll: true,
    includeUncategorized: true,
  })
  return (
    <MultiSelect
      {...options}
      value={value}
      onChange={onChange}
      trigger={trigger}
      popup={popup}
    />
  )
}
