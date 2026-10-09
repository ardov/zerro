import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import {
  DateCalendarAction,
  nativeDateTimeControlClass,
} from '@/6-shared/ui/kit/DateFieldParts'
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
    <div className="flex flex-col gap-2">
      <DateBoundField
        label={t('dateFrom')}
        value={value.from}
        onChange={from => onChange({ ...value, from })}
      />
      <DateBoundField
        label={t('dateTo')}
        value={value.to}
        onChange={to => onChange({ ...value, to })}
      />
    </div>
  )
}

function DateBoundField({
  label,
  value,
  onChange,
}: {
  label: string
  value: TISODate | undefined
  onChange: (value: TISODate | undefined) => void
}) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const { t } = useTranslation()
  return (
    <div ref={setAnchor} className="min-w-0 flex-1">
      <Input
        type="date"
        labelMode="floating"
        label={label}
        controlClassName={nativeDateTimeControlClass}
        value={value ?? ''}
        onValueChange={next => onChange(next ? (next as TISODate) : undefined)}
        start={
          <DateCalendarAction
            value={value ?? null}
            onChange={onChange}
            anchor={anchor}
            label={`${t('selectDate')}: ${label}`}
          />
        }
      />
    </div>
  )
}
