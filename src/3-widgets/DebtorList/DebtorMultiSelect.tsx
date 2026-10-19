import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { PopupController } from '@/6-shared/overlays'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'

export function DebtorMultiSelect({
  value,
  onChange,
  trigger,
  popup,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  trigger: ReactElement
  popup: PopupController
}) {
  const { t } = useTranslation('filterDrawer')
  const debtors = useAppSelector(core.debtors.selectOptions)
  return (
    <MultiSelect
      label={t('debtor')}
      value={value}
      onChange={onChange}
      popup={popup}
      trigger={trigger}
      search={{ label: t('findDebtor'), placeholder: t('findDebtor') }}
      items={[...new Set([...Object.keys(debtors), ...value])]
        .map(value => ({ value, label: debtors[value] || value }))
        .sort((a, b) => a.label.localeCompare(b.label))}
    />
  )
}
