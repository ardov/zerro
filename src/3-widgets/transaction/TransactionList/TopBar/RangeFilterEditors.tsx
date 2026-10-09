import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import { Input } from '@/6-shared/ui/kit/Input'
import type { AmountClause, DateClause, Clause } from './filterModel'

export function AmountFilterEditor(props: {
  clause: AmountClause
  onChange: (clause: Clause) => void
}) {
  const { clause, onChange } = props
  const { t } = useTranslation('filterDrawer')

  return (
    <div className="flex flex-row gap-2">
      <Input
        labelMode="floating"
        className="min-w-0 flex-1"
        autoFocus
        type="number"
        label={t('amountFrom')}
        value={clause.gte ?? ''}
        onChange={event =>
          onChange({
            ...clause,
            gte: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
      <Input
        labelMode="floating"
        className="min-w-0 flex-1"
        type="number"
        label={t('amountTo')}
        value={clause.lte ?? ''}
        onChange={event =>
          onChange({
            ...clause,
            lte: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
    </div>
  )
}

export function DateFilterEditor({
  value,
  onChange,
}: {
  value: DateClause
  onChange: (value: DateClause) => void
}) {
  const { t } = useTranslation('filterDrawer')
  return (
    <div className="flex gap-2">
      <Input
        autoFocus
        type="date"
        labelMode="floating"
        label={t('dateFrom')}
        className="min-w-0 flex-1"
        value={value.from ?? ''}
        onValueChange={from =>
          onChange({ ...value, from: from ? (from as TISODate) : undefined })
        }
      />
      <Input
        type="date"
        labelMode="floating"
        label={t('dateTo')}
        className="min-w-0 flex-1"
        value={value.to ?? ''}
        onValueChange={to =>
          onChange({ ...value, to: to ? (to as TISODate) : undefined })
        }
      />
    </div>
  )
}
