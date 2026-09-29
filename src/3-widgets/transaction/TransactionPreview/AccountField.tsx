import { useTranslation } from 'react-i18next'
import type { TAccountId } from '@/6-shared/types'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import { FilledButton, type FilledFieldState } from '@/6-shared/ui/FilledField'
import { core } from '@/zerro-core/redux'
import { AccountSelect } from '../../account/AccountSelect'
import { AccountIcon } from '../../account/AccountIcon'

export type AccountFieldProps = FilledFieldState & {
  value: TAccountId
  onChange: (id: TAccountId) => void
  excludeIds?: readonly TAccountId[]
  label: string
  className?: string
}

export function AccountField({
  value,
  onChange,
  excludeIds,
  label,
  className,
  ...state
}: AccountFieldProps) {
  const { t } = useTranslation('transaction')
  const current = core.accounts.usePopulated()[value]
  return (
    <AccountSelect
      value={value}
      onChange={onChange}
      excludeIds={excludeIds}
      label={label}
      disabled={state.disabled}
      readOnly={state.readOnly}
      trigger={
        <FilledButton
          {...state}
          aria-label={label}
          icon={<AccountIcon account={current} />}
          trailing={
            <ChevronDownIcon size={20} className="text-icon-foreground" />
          }
          className={className}
        >
          {current?.title ?? t('accountMissing')}
        </FilledButton>
      }
    />
  )
}
