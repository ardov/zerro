import type { TAccountId } from '@/6-shared/types'
import { Select, type SelectProps } from '@/6-shared/ui/kit/Select'
import { useAccountOptions } from '../../account/useAccountOptions'

export type AccountFieldProps = Pick<
  SelectProps,
  'invalid' | 'error' | 'disabled' | 'readOnly' | 'className'
> & {
  value: TAccountId
  onChange: (id: TAccountId) => void
  excludeIds?: readonly TAccountId[]
  label: string
}

export function AccountField(props: AccountFieldProps) {
  const { value, onChange, excludeIds, label, ...restProps } = props
  const options = useAccountOptions(
    { selectedIds: value ? [value] : [], excludeIds },
    label
  )
  return (
    <Select
      {...options}
      {...restProps}
      label={label}
      required
      value={value || null}
      onChange={id => {
        if (id !== null) onChange(id)
      }}
    />
  )
}
