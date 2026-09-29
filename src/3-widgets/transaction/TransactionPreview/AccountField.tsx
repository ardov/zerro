import type { TAccountId } from '@/6-shared/types'
import {
  AccountSelect,
  type AccountSelectProps,
} from '../../account/AccountSelect'

export type AccountFieldProps = Omit<
  AccountSelectProps,
  'value' | 'required' | 'trigger'
> & {
  value: TAccountId
}

export function AccountField(props: AccountFieldProps) {
  const { value, ...restProps } = props
  return <AccountSelect {...restProps} required value={value || null} />
}
