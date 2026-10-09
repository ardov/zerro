import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/6-shared/overlays'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { Popover } from '@/6-shared/ui/kit/Popover'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import { CalendarIcon, PlaceIcon } from '@/6-shared/ui/Icons'
import { AccountMultiSelect } from '../../../account/AccountMultiSelect'
import { CategoryMultiSelect } from '../../../category/CategoryMultiSelect'
import { MerchantMultiSelect } from '../../../merchant/MerchantMultiSelect'
import { core } from '@/zerro-core/redux'
import { AmountFilterEditor, DateFilterEditor } from './RangeFilterEditors'
import {
  getTypeLabel,
  isEmptyClause,
  type Clause,
  type DateClause,
} from './filterModel'

/** Each stable chip owns exactly one modal editor and its editing-session draft. */
export function FilterChip({
  clause,
  label,
  autoOpen,
  onChange,
  onRemove,
  ref,
}: {
  clause: Clause
  label: string
  autoOpen: boolean
  onChange: (clause: Clause) => void
  onRemove: () => void
  ref: Ref<HTMLElement>
}) {
  const { t } = useTranslation('filterDrawer')
  const [dates, setDates] = useState<DateClause>(() =>
    clause.kind === 'date'
      ? core.transactions.normalizeDateFilter(clause)
      : { kind: 'date' }
  )
  const popup = usePopup(() => {
    if (isEmptyClause(clause)) onRemove()
    if (clause.kind === 'date')
      setDates(core.transactions.normalizeDateFilter(clause))
  })
  const started = useRef(false)
  useLayoutEffect(() => {
    if (autoOpen && !started.current) {
      started.current = true
      popup.setOpen(true)
    }
  }, [autoOpen, popup])
  const chip = (
    <Chip
      className="min-w-0 shrink"
      ref={ref}
      overflow="fade"
      variant={isEmptyClause(clause) ? 'outline-draft' : 'filled'}
      start={
        clause.kind === 'date' ? (
          <CalendarIcon />
        ) : clause.kind === 'merchant' ? (
          <PlaceIcon />
        ) : undefined
      }
      onClick={() => {
        if (clause.kind === 'date' && !popup.open)
          setDates(core.transactions.normalizeDateFilter(clause))
      }}
      onRemove={onRemove}
    >
      {label}
    </Chip>
  )
  switch (clause.kind) {
    case 'account':
      return (
        <AccountMultiSelect
          value={clause.ids}
          onChange={ids => onChange({ ...clause, ids })}
          popup={popup}
          trigger={chip}
        />
      )
    case 'tag':
      return (
        <CategoryMultiSelect
          value={clause.ids}
          onChange={ids => onChange({ ...clause, ids })}
          popup={popup}
          trigger={chip}
        />
      )
    case 'merchant':
      return (
        <MerchantMultiSelect
          value={clause.ids}
          onChange={ids => onChange({ ...clause, ids })}
          popup={popup}
          trigger={chip}
        />
      )
    case 'type':
      return (
        <MultiSelect
          label={t('transactionType')}
          value={clause.values}
          onChange={values => onChange({ ...clause, values })}
          popup={popup}
          trigger={chip}
          items={Object.values(core.transactions.TrFilterType).map(value => ({
            value,
            label: getTypeLabel(value, t),
          }))}
        />
      )
    case 'amount':
      return (
        <Popover label={t('amount')} popup={popup} trigger={chip}>
          <AmountFilterEditor clause={clause} onChange={onChange} />
        </Popover>
      )
    case 'date':
      return (
        <Popover label={t('date')} popup={popup} trigger={chip}>
          <DateFilterEditor
            value={dates}
            onChange={next => {
              setDates(next)
              onChange(core.transactions.normalizeDateFilter(next))
            }}
          />
        </Popover>
      )
    default:
      return chip
  }
}
