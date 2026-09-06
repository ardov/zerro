import type { Locale } from 'date-fns'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  dateInputPlaceholder,
  formatDateInput,
  getDateLocale,
  parseDateInput,
  toISODate,
} from '@/6-shared/helpers/date'
import { usePopup } from '@/6-shared/overlays'
import type { TDateDraft, TISODate } from '@/6-shared/types'
import { AdaptivePopover } from './AdaptivePopover'
import { IconButton } from './Button'
import { Calendar } from './Calendar'
import { CalendarIcon } from './Icons'
import type { TFieldSize } from './OutlinedField'
import { OutlinedField } from './OutlinedField'

export type DatePickerProps = {
  label?: ReactNode
  value: TISODate
  onChange: (date: TISODate) => void
  minDate?: TDateDraft
  maxDate?: TDateDraft
  size?: TFieldSize
  fullWidth?: boolean
  disabled?: boolean
  className?: string
}

/** A date field with a calendar behind it: the date can be typed, or picked
 * out of the month grid the button opens.
 *
 * The text half is a plain text input rather than a native date control, and
 * that is the point — a `type="date"` input is the browser's calendar, which
 * is a different control in every browser and the OS wheel on a phone. What
 * it gives up is the segmented typing, so `parseDateInput` reads the three
 * numbers in whatever order the language writes them.
 *
 * A half-typed date is held as text and not reported: the field stays on the
 * last whole date it had, marks itself invalid while the text is not one,
 * and reformats to the value it kept once focus leaves. */
export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  size = 'medium',
  fullWidth,
  disabled,
  className,
}: DatePickerProps) {
  const { t } = useTranslation()
  const locale = getDateLocale()
  // The whole field is the anchor, so the calendar hangs under it rather than
  // under the button that opened it. Held as state and not a ref: the
  // popover needs the element while rendering, and a ref has nothing in it
  // until after that.
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  // On the stack rather than in state of its own, so Back closes the calendar
  // instead of the drawer it was opened from. On a phone this surface *is* a
  // drawer, and the one under it is usually the transaction being edited.
  const [open, setOpen] = usePopup()
  // What the field shows, which is the value until someone types something
  // else into it. Both of the things it is derived from are held beside it,
  // so a value or a language arriving from outside replaces the text and a
  // keystroke does not.
  //
  // This holds for a caller that takes every date it is handed, which is the
  // contract `onChange` states. One that clamps or ignores a date instead
  // would leave `value` where it was, and the reset below would take back
  // what was being typed mid-keystroke: bound such a field with `minDate` and
  // `maxDate`, which are checked here, rather than by refusing the report.
  const [draft, setDraft] = useState(() => shown(value, locale))
  if (draft.value !== value || draft.code !== locale.code) {
    setDraft(shown(value, locale))
  }
  // Empty is not yet wrong: nothing is being claimed, and blur puts the kept
  // date back. Text that is trying to be a date and is not one is wrong.
  const invalid =
    draft.text.trim() !== '' &&
    (!draft.typed || outOfBounds(draft.typed, minDate, maxDate))

  const handleType = (text: string) => {
    const typed = parseDateInput(text, locale)
    const whole = typed && !outOfBounds(typed, minDate, maxDate)
    setDraft({ value: whole ? typed : value, code: locale.code, text, typed })
    if (whole && typed !== value) onChange(typed)
  }

  return (
    <div
      ref={setAnchor}
      className={fullWidth ? 'flex w-full min-w-0' : 'inline-flex'}
    >
      <OutlinedField
        label={label}
        className={className}
        value={draft.text}
        onChange={event => handleType(event.target.value)}
        // Whatever was left half-typed is not what the field is worth: it
        // reports the date it kept, spelled the way it spells every other one.
        onBlur={() => setDraft(shown(value, locale))}
        placeholder={dateInputPlaceholder(locale)}
        inputMode="numeric"
        autoComplete="off"
        error={invalid}
        // A field that has gone red says why. `Field.Root` points the input
        // at this through `aria-describedby`, so the reason is read out and
        // not only seen.
        helperText={invalid ? t('invalidDate') : undefined}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        endAdornment={
          <IconButton
            size="small"
            edge="end"
            disabled={disabled}
            aria-label={t('selectDate')}
            onClick={() => setOpen(true)}
          >
            <CalendarIcon size={20} />
          </IconButton>
        }
      />
      <AdaptivePopover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchor}
        placement="below"
        aria-label={t('selectDate')}
        className="flex justify-center p-2"
      >
        <Calendar
          autoFocus
          value={value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={date => {
            setOpen(false)
            onChange(date)
          }}
        />
      </AdaptivePopover>
    </div>
  )
}

/** The field showing a date it is sure of: the text spelled the locale's way,
 * and the date it reads back without parsing it again — `formatDateInput`
 * round-trips, so that date is the value itself. */
function shown(value: TISODate, locale: Locale) {
  return {
    value,
    code: locale.code,
    text: formatDateInput(value, locale),
    typed: value as TISODate | null,
  }
}

function outOfBounds(date: TISODate, min?: TDateDraft, max?: TDateDraft) {
  if (min && date < toISODate(min)) return true
  if (max && date > toISODate(max)) return true
  return false
}
