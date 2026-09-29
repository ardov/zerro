import type { TAccountId } from '@/6-shared/types'
import { Select, type SelectProps } from '@/6-shared/ui/kit/Select'
import { useAccountOptions } from './useAccountOptions'

export type AccountSelectProps = Pick<
  SelectProps,
  | 'trigger'
  | 'required'
  | 'invalid'
  | 'error'
  | 'disabled'
  | 'readOnly'
  | 'className'
> & {
  value: TAccountId | null
  onChange: (id: TAccountId) => void
  excludeIds?: readonly TAccountId[]
  label: string
}
export function AccountSelect(props: AccountSelectProps) {
  const { value, onChange, excludeIds, label, ...restProps } = props
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
      {...restProps}
      label={label}
      value={value}
      onChange={id => {
        if (id !== null) onChange(id)
      }}
    />
  )
}
