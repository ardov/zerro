import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import { FieldSurface, fieldControlClass } from '@/6-shared/ui/kit/Field'
import {
  DateCalendarAction,
  nativeDateTimeControlClass,
} from '@/6-shared/ui/kit/DateFieldParts'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type DateTimeFieldProps = {
  date: TISODate
  onDateChange: (date: TISODate) => void
  /** `HH:mm`. */
  time: string
  onTimeChange: (time: string) => void
  className?: string
}

const nativeControlClass = cn(
  fieldControlClass,
  nativeDateTimeControlClass,
  'py-3'
)

/** Native date and time share one surface. Incomplete dates revert on blur;
 * choosing a calendar day changes only the date. */
export function DateTimeField(props: DateTimeFieldProps) {
  const { date, onDateChange, time, onTimeChange, className } = props
  const { t } = useTranslation('transaction')
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  // A native date input reads as empty while a segment is incomplete.
  const [blankedDate, setBlankedDate] = useState<TISODate | null>(null)

  return (
    <FieldSurface
      ref={setAnchor}
      controlRef={dateRef}
      className={className}
      start={
        <DateCalendarAction
          value={date}
          onChange={onDateChange}
          anchor={anchor}
        />
      }
    >
      <input
        ref={dateRef}
        type="date"
        value={blankedDate === date ? '' : date}
        aria-label={t('date')}
        onChange={event => {
          const next = event.target.value
          const complete = next !== '' && event.target.validity.valid
          setBlankedDate(complete ? null : date)
          if (complete && next !== date) onDateChange(next as TISODate)
        }}
        onBlur={() => setBlankedDate(null)}
        className={cn(nativeControlClass, 'flex-1')}
      />
      <input
        type="time"
        aria-label={t('time')}
        value={time}
        onChange={event => onTimeChange(event.target.value)}
        className={cn(
          nativeControlClass,
          'ml-3 w-auto shrink-0 text-right text-ui-secondary [&::-webkit-date-and-time-value]:text-right'
        )}
      />
    </FieldSurface>
  )
}
