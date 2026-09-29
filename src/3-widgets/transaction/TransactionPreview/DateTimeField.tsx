import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import { Popover } from '@/6-shared/ui/kit/Popover'
import { Calendar } from '@/6-shared/ui/kit/Calendar'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { CalendarIcon } from '@/6-shared/ui/Icons'
import {
  FieldSurface,
  FieldAddon,
  fieldControlClass,
} from '@/6-shared/ui/kit/Field'
import { usePopup } from '@/6-shared/overlays'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type DateTimeFieldProps = {
  date: TISODate
  onDateChange: (date: TISODate) => void
  /** `HH:mm`. */
  time: string
  onTimeChange: (time: string) => void
  className?: string
}

/** Native date and time share one surface. Incomplete dates revert on blur;
 * choosing a calendar day changes only the date. */
export function DateTimeField(props: DateTimeFieldProps) {
  const { date, onDateChange, time, onTimeChange, className } = props
  const { t } = useTranslation('transaction')
  // The calendar's own label belongs to the date picker's vocabulary, which
  // is shared and lives in `common`.
  const { t: tCommon } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const popup = usePopup()
  const dateRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState({ source: date, value: date as string })
  if (draft.source !== date) setDraft({ source: date, value: date })

  return (
    <FieldSurface
      ref={setAnchor}
      controlRef={dateRef}
      className={className}
      start={
        <FieldAddon kind="action">
          <Popover
            popup={popup}
            anchor={anchor}
            label={tCommon('selectDate')}
            className="w-fit"
            contentClassName="flex justify-center p-1"
            trigger={
              <IconButton
                label={tCommon('selectDate')}
                variant="ghost"
                size="sm"
                tooltip={false}
              >
                <CalendarIcon />
              </IconButton>
            }
          >
            <Calendar
              autoFocus
              value={date}
              onChange={next => {
                popup.setOpen(false)
                onDateChange(next)
              }}
            />
          </Popover>
        </FieldAddon>
      }
    >
      <input
        ref={dateRef}
        type="date"
        value={draft.value}
        aria-label={t('date')}
        onChange={event => {
          const next = event.target.value
          const complete = next !== '' && event.target.validity.valid
          setDraft({
            source: complete ? (next as TISODate) : date,
            value: next,
          })
          if (complete && next !== date) onDateChange(next as TISODate)
        }}
        onBlur={() => setDraft({ source: date, value: date })}
        className={cn(
          fieldControlClass,
          'flex-1 appearance-none py-3',
          '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:appearance-none',
          '[&::-webkit-datetime-edit]:p-0'
        )}
      />
      <input
        type="time"
        aria-label={t('time')}
        value={time}
        onChange={event => onTimeChange(event.target.value)}
        className={cn(
          fieldControlClass,
          'ml-3 w-auto shrink-0 appearance-none py-3 text-right text-ui-secondary',
          '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:appearance-none',
          '[&::-webkit-datetime-edit]:p-0 [&::-webkit-date-and-time-value]:text-right'
        )}
      />
    </FieldSurface>
  )
}
