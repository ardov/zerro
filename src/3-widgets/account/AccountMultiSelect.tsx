import type { ReactElement } from 'react'
import type { TAccountId } from '@/6-shared/types'
import type { PopupController } from '@/6-shared/overlays'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import { useTranslation } from 'react-i18next'
import { useAccountOptions } from './useAccountOptions'

export type AccountMultiSelectProps = {
  value: TAccountId[]
  onChange: (ids: TAccountId[]) => void
  trigger: ReactElement
  popup?: PopupController
}
export function AccountMultiSelect({
  value,
  onChange,
  trigger,
  popup,
}: AccountMultiSelectProps) {
  const { t } = useTranslation('filterDrawer')
  const options = useAccountOptions({ selectedIds: value }, t('account'))
  return (
    <MultiSelect
      {...options}
      label={t('account')}
      value={value}
      onChange={onChange}
      trigger={trigger}
      popup={popup}
    />
  )
}
