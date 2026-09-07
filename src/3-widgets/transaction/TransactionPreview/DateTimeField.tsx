import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TISODate } from '@/6-shared/types'
import {
  dateInputPlaceholder,
  formatDateInput,
  getDateLocale,
  parseDateInput,
} from '@/6-shared/helpers/date'
import { AdaptivePopover } from '@/6-shared/ui/AdaptivePopover'
import { Calendar } from '@/6-shared/ui/Calendar'
import { CalendarIcon } from '@/6-shared/ui/Icons'
import {
  FilledField,
  filledControlClass,
  filledFieldActionClass,
} from '@/6-shared/ui/FilledField'
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

/** When the transaction happened, as one row: the date typed or picked, and
 * the time of day as a quieter second value at the end of it.
 *
 * The two belong together — nobody sets one without knowing the other — and
 * separating them would take a whole row for four characters. The date is the
 * one that is read, so it keeps the field's own colour; the time is muted.
 *
 * Like `DatePicker`, half-typed text is held rather than reported: the field
 * stays on the last whole date it had and reformats on blur. The glyph opens
 * the calendar, which is the one part of this that a filled field can do and
 * an outlined one cannot — there is no room for a trailing button beside a
 * value that already has one. */
export const DateTimeField: FC<DateTimeFieldProps> = ({
  date,
  onDateChange,
  time,
  onTimeChange,
  className,
}) => {
  const { t } = useTranslation('transaction')
  // The calendar's own label belongs to the date picker's vocabulary, which
  // is shared and lives in `common`.
  const { t: tCommon } = useTranslation()
  const locale = getDateLocale()
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = usePopup()
  const [draft, setDraft] = useState(() => formatDateInput(date, locale))
  const [shown, setShown] = useState({ date, code: locale.code })
  if (shown.date !== date || shown.code !== locale.code) {
    setShown({ date, code: locale.code })
    setDraft(formatDateInput(date, locale))
  }
  const invalid = draft.trim() !== '' && !parseDateInput(draft, locale)

  return (
    <FilledField ref={setAnchor} className={className}>
      <button
        type="button"
        aria-label={tCommon('selectDate')}
        onClick={() => setOpen(true)}
        className={filledFieldActionClass}
      >
        <CalendarIcon size={20} />
      </button>
      <input
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
          if (typed && typed !== date) onDateChange(typed)
        }}
        // Whatever was left half-typed is not what the field is worth.
        onBlur={() => setDraft(formatDateInput(date, locale))}
        className={cn(filledControlClass, invalid && 'text-error')}
      />
      <input
        type="time"
        aria-label={t('time')}
        value={time}
        onChange={event => onTimeChange(event.target.value)}
        // The browser's own clock button is a second way to do what the field
        // already does, and it does not fit beside four characters.
        className="w-[62px] shrink-0 border-0 bg-transparent p-0 text-right font-[family-name:inherit] text-[length:inherit] leading-[inherit] text-muted-foreground outline-none [&::-webkit-calendar-picker-indicator]:hidden"
      />

      <AdaptivePopover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        placement="below"
        aria-label={tCommon('selectDate')}
        className="flex justify-center p-2"
      >
        <Calendar
          autoFocus
          value={date}
          onChange={next => {
            setOpen(false)
            onDateChange(next)
          }}
        />
      </AdaptivePopover>
    </FilledField>
  )
}
