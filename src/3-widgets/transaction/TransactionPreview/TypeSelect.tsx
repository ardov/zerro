import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { useTranslation } from 'react-i18next'
import { Button } from '@/6-shared/ui/kit/Button'
import { Select } from '@/6-shared/ui/kit/Select'
import { ChevronDownIcon } from '@/6-shared/ui/Icons'
import type { TDraftType } from './draft'

export const draftTypes = [
  'outcome',
  'income',
  'transfer',
  'outcomeDebt',
  'incomeDebt',
] as const satisfies readonly TDraftType[]

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
          <TextFade>{t(`type_${value}`)}</TextFade>
          <ChevronDownIcon />
        </Button>
      }
    />
  )
}
