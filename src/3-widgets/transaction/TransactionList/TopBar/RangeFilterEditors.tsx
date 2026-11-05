import { core } from '@/zerro-core/redux'
import { CurrencyCodeSelect } from '@/3-widgets/currency/CurrencyCodeSelect'
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
  const accounts = core.accounts.usePopulated()
  const currencies = [
    ...new Set(
      Object.values(accounts)
        .filter(
          account =>
            account.type !== 'debt' &&
            !core.accounts.isZerroDataAccount(account)
        )
        .map(account => account.fxCode)
        .filter(Boolean)
    ),
  ].sort()

  return (
    <div className="flex flex-col gap-2">
      <Input
        className="min-w-0 flex-1"
        autoFocus
        type="number"
        prefix={t('amountFromShort')}
        step="any"
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
        className="min-w-0 flex-1"
        type="number"
        prefix={t('amountToShort')}
        step="any"
        label={t('amountTo')}
        value={clause.lte ?? ''}
        onChange={event =>
          onChange({
            ...clause,
            lte: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
      <CurrencyCodeSelect
        label={t('common:currency')}
        placeholder={t('common:currency')}
        clearLabel={t('common:removeValue', { label: t('common:currency') })}
        value={clause.currencies?.[0] ?? null}
        onChange={currency =>
          onChange({ ...clause, currencies: currency ? [currency] : undefined })
        }
        currencies={currencies}
        search={{
          label: t('findCurrency'),
          placeholder: t('findCurrency'),
          showMoreLabel: t('common:showMore'),
        }}
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
