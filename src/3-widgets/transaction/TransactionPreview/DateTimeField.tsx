import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import {
  dateInputPlaceholder,
  formatDateInput,
  getDateLocale,
  parseDateInput,
} from '@/6-shared/helpers/date'
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

/** Date and native time share one surface. Invalid date drafts revert on blur;
 * choosing a calendar day changes only the date. */
export function DateTimeField(props: DateTimeFieldProps) {
  const { date, onDateChange, time, onTimeChange, className } = props
  const { t } = useTranslation('transaction')
  // The calendar's own label belongs to the date picker's vocabulary, which
  // is shared and lives in `common`.
  const { t: tCommon } = useTranslation()
  const locale = getDateLocale()
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const popup = usePopup()
  const dateRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(() => formatDateInput(date, locale))
  const [shown, setShown] = useState({ date, code: locale.code })
  if (shown.date !== date || shown.code !== locale.code) {
    setShown({ date, code: locale.code })
    setDraft(formatDateInput(date, locale))
  }
  const invalid = draft.trim() !== '' && !parseDateInput(draft, locale)

  return (
    <FieldSurface
      ref={setAnchor}
      controlRef={dateRef}
      invalid={invalid}
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
        value={draft}
        aria-label={t('date')}
        aria-invalid={invalid || undefined}
        placeholder={dateInputPlaceholder(locale)}
        inputMode="numeric"
        autoComplete="off"
        onChange={event => {
          const text = event.target.value
          setDraft(text)
          const typed = parseDateInput(text, locale)
          if (typed && typed !== date) {
            // The parent's echo must not reformat a date mid-keystroke.
            setShown({ date: typed, code: locale.code })
            onDateChange(typed)
          }
        }}
        // Whatever was left half-typed is not what the field is worth.
        onBlur={() => setDraft(formatDateInput(date, locale))}
        className={cn(
          fieldControlClass,
          'flex-1 py-3',
          invalid && 'text-ui-error'
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
