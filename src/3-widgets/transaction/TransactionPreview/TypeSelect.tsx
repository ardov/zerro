import { useTranslation } from 'react-i18next'
import { Button } from '@/6-shared/ui/kit/Button'
import { Select } from '@/6-shared/ui/kit/Select'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import type { TDraftType } from './draft'

/** Every type a transaction can be turned into, in the order the menu offers
 * them. The two debt directions are last because they are the two a person
 * reaches for least, and one of them may not be offered at all. */
export const draftTypes = [
  'outcome',
  'income',
  'transfer',
  'outcomeDebt',
  'incomeDebt',
] as const satisfies readonly TDraftType[]

/** The transaction type remains the editor heading and its selection trigger. */
export function TypeSelect(props: {
  value: TDraftType
  onChange: (type: TDraftType) => void
  unavailable?: readonly TDraftType[]
}) {
  const { value, onChange, unavailable = [] } = props
  const { t } = useTranslation('transaction')
  return (
    <Select
      label={t('typeLabel')}
      value={value}
      required
      items={draftTypes.map(type => ({
        value: type,
        label: t(`type_${type}`),
        disabled: unavailable.includes(type),
      }))}
      onChange={onChange}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 max-w-full text-ui-20"
        >
          <span className="truncate">{t(`type_${value}`)}</span>
          <ChevronDownIcon />
        </Button>
      }
    />
  )
}
