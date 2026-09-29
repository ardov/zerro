import type { ReactElement } from 'react'
import type { TAccountId } from '@/6-shared/types'
import { Select } from '@/6-shared/ui/kit/Select'
import { useAccountOptions } from './useAccountOptions'

export type AccountSelectProps = {
  value: TAccountId | null
  onChange: (id: TAccountId) => void
  excludeIds?: readonly TAccountId[]
  label: string
  trigger: ReactElement
  disabled?: boolean
  readOnly?: boolean
}
export function AccountSelect({
  value,
  onChange,
  excludeIds,
  label,
  trigger,
  disabled,
  readOnly,
}: AccountSelectProps) {
  const options = useAccountOptions(
    {
      selectedIds: value ? [value] : [],
      excludeIds,
    },
    label
  )
  return (
    <Select
      {...options}
      label={label}
      value={value}
      onChange={id => {
        if (id !== null) onChange(id)
      }}
      trigger={trigger}
      popupMinWidth={280}
      disabled={disabled}
      readOnly={readOnly}
    />
  )
}
