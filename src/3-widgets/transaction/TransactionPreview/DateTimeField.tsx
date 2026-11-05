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
  onDateCommit?: (date: TISODate) => void
  /** `HH:mm`. */
  time: string
  onTimeChange: (time: string) => void
  onTimeCommit?: (time: string) => void
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
  const {
    date,
    onDateChange,
    onDateCommit,
    time,
    onTimeChange,
    onTimeCommit,
    className,
  } = props
  const { t } = useTranslation('transaction')
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  // Native controls expose an empty value while a segment is incomplete.
  // Keep even complete intermediate segments local until the field is done.
  const [blankedDate, setBlankedDate] = useState<TISODate | null>(null)
  const [blankedTime, setBlankedTime] = useState<string | null>(null)
  const initialDate = useRef(date)
  const initialTime = useRef(time)

  return (
    <FieldSurface
      ref={setAnchor}
      controlRef={dateRef}
      className={className}
      start={
        <DateCalendarAction
          value={date}
          onChange={next => {
            onDateChange(next)
            onDateCommit?.(next)
          }}
          anchor={anchor}
        />
      }
    >
      <input
        ref={dateRef}
        type="date"
        value={blankedDate === date ? '' : date}
        aria-label={t('date')}
        onFocus={() => {
          initialDate.current = date
        }}
        onChange={event => {
          const next = event.currentTarget.value
          const complete = next !== '' && event.currentTarget.validity.valid
          setBlankedDate(complete ? null : initialDate.current)
          onDateChange(complete ? (next as TISODate) : initialDate.current)
        }}
        onBlur={event => {
          const next = event.currentTarget.value
          setBlankedDate(null)
          if (next && event.currentTarget.validity.valid)
            onDateCommit?.(next as TISODate)
          else onDateChange(initialDate.current)
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        className={cn(nativeControlClass, 'flex-1')}
      />
      <input
        type="time"
        aria-label={t('time')}
        value={blankedTime === time ? '' : time}
        onFocus={() => {
          initialTime.current = time
        }}
        onChange={event => {
          const next = event.currentTarget.value
          const complete = next !== '' && event.currentTarget.validity.valid
          setBlankedTime(complete ? null : initialTime.current)
          onTimeChange(complete ? next : initialTime.current)
        }}
        onBlur={event => {
          const next = event.currentTarget.value
          setBlankedTime(null)
          if (next && event.currentTarget.validity.valid) onTimeCommit?.(next)
          else onTimeChange(initialTime.current)
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        className={cn(
          nativeControlClass,
          'ml-3 w-auto shrink-0 text-right text-ui-secondary [&::-webkit-date-and-time-value]:text-right'
        )}
      />
    </FieldSurface>
  )
}
