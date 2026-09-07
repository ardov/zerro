import type { ButtonHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { ChevronProps, DayButtonProps, Matcher } from 'react-day-picker'
import { DayPicker } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import {
  formatDate,
  getDateLocale,
  parseDate,
  toISODate,
} from '@/6-shared/helpers/date'
import type { TDateDraft, TISODate } from '@/6-shared/types'
import { ButtonBase, IconButton } from './Button'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { cn } from './shadcn/utils'

export type CalendarProps = {
  /** The selected day. A calendar always has one — every date this app picks
   * belongs to something that already has a date. */
  value: TDateDraft
  onChange: (date: TISODate) => void
  /** The first and last day that can be picked. Days outside them are shown
   * greyed rather than hidden, and the navigation stops at their months. */
  minDate?: TDateDraft
  maxDate?: TDateDraft
  /** Puts the keyboard on the selected day as the calendar appears, which is
   * what a calendar opened by a keyboard user needs. */
  autoFocus?: boolean
  className?: string
}

/** A month grid, `react-day-picker` with this app's own paint on it.
 *
 * The library ships a stylesheet of its own and none of it is loaded: every
 * element that needs paint is named in `classNames` below, and the three that
 * are controls — the two navigation buttons and the day itself — are swapped
 * for the app's own `IconButton` and `ButtonBase` through `components`. What
 * is left of the library is the calendar arithmetic, the keyboard grid and
 * the ARIA, which is the part worth having.
 *
 * Month names, weekday headers and the day labels a screen reader announces
 * all come from the `date-fns` locale the rest of the app formats with, so
 * the calendar follows the language switcher without a provider. */
export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  autoFocus,
  className,
}: CalendarProps) {
  const { t } = useTranslation()
  const selected = parseDate(value)
  const min = minDate ? parseDate(minDate) : undefined
  const max = maxDate ? parseDate(maxDate) : undefined
  const outOfBounds: Matcher[] = []
  if (min) outOfBounds.push({ before: min })
  if (max) outOfBounds.push({ after: max })
  // The month on screen, held rather than defaulted: a selection arriving
  // from outside while the grid is up — a date typed into the field this
  // hangs under, a day clicked in the month next door — brings the grid to
  // it. Paging with the arrows moves this and nothing else.
  //
  // Compared as an ISO string and not as the prop, which may be a `Date`: a
  // fresh one every render would reset this on every render.
  const iso = toISODate(value)
  const [shown, setShown] = useState(() => ({ value: iso, month: selected }))
  if (shown.value !== iso) setShown({ value: iso, month: parseDate(iso) })
  return (
    <DayPicker
      mode="single"
      // The current day cannot be un-picked by clicking it again: there is no
      // transaction here without a date, and no list position without one.
      required
      selected={selected}
      onSelect={date => onChange(toISODate(date))}
      month={shown.month}
      onMonthChange={month => setShown(shown => ({ ...shown, month }))}
      startMonth={min}
      endMonth={max}
      disabled={outOfBounds}
      autoFocus={autoFocus}
      locale={getDateLocale()}
      // Both buttons sit beside the caption rather than in a bar of their own,
      // which is the header `MonthSelectPopover` already draws for its years.
      navLayout="around"
      showOutsideDays
      className={className}
      labels={{
        labelPrevious: () => t('previousMonth'),
        labelNext: () => t('nextMonth'),
        // The library writes this one itself, and writes it in English:
        // `Today, ` and `, selected` are literals in its source. The date is
        // localized here, today is named in the app's own word for it, and
        // the selection is left to the `aria-selected` the cell already
        // carries rather than said twice.
        labelDayButton: (date, modifiers) =>
          modifiers.today
            ? `${t('today')}, ${formatDate(date, 'PPPP')}`
            : formatDate(date, 'PPPP'),
      }}
      components={{
        Chevron: CalendarChevron,
        PreviousMonthButton: NavButton,
        NextMonthButton: NavButton,
        DayButton: CalendarDay,
      }}
      classNames={classNames}
    />
  )
}

/** The elements that need paint. What is not named here needs none — a row is
 * a `tr` and lays itself out — and keeps the `rdp-*` class the library
 * defaults it to, which resolves to nothing with the stylesheet unloaded.
 * The two navigation buttons and the day button are missing on purpose: they
 * are components below rather than class names, and paint themselves. */
const classNames = {
  root: 'w-max font-sans text-foreground',
  months: 'flex flex-col',
  // Three columns: the previous button, the caption, the next button. The
  // grid below spans all of them.
  month: 'grid grid-cols-[auto_1fr_auto] items-center',
  month_caption: 'flex min-w-0 justify-center px-2',
  // `inline-block` so the first letter is addressable: `date-fns` writes
  // Russian month names in lower case, and a caption is not a sentence.
  caption_label:
    'inline-block truncate text-body font-medium first-letter:uppercase',
  month_grid: 'col-span-3 border-collapse',
  weekday: 'w-10 pb-1 text-caption text-muted-foreground',
  day: 'p-0.5 text-center',
}

/** The two navigation buttons — one component, because the library types both
 * as a plain button and the only thing that differs is the chevron it is
 * handed. They carry `aria-disabled` rather than `disabled` — the library
 * keeps them focusable at the ends of the range — so the disabled paint is
 * keyed off that. */
function NavButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <IconButton
      {...props}
      color="default"
      className={cn(
        'aria-disabled:pointer-events-none aria-disabled:text-disabled-control-foreground',
        props.className
      )}
    />
  )
}

function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeftIcon : ChevronRightIcon
  return <Icon className={className} />
}

/** One day. The selected day is filled the way a primary button is, today is
 * outlined the way the current month is in `MonthSelectPopover`, and a day
 * outside the month or outside the bounds is dimmed rather than removed.
 *
 * The focus effect is the library's own, copied from its `DayButton` line for
 * line: it moves the keyboard between days by marking one focused, and a
 * replacement component that dropped this would leave the arrow keys
 * announcing days without reaching them. Worth re-reading that component on a
 * major version bump — it is the one piece of the library reimplemented here
 * rather than configured. */
function CalendarDay({ day, modifiers, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  return (
    <ButtonBase
      ref={ref}
      {...props}
      className={cn(
        'size-9 rounded-full font-sans text-body text-foreground transition-colors duration-150 ease-in-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        modifiers.today && 'border border-solid border-primary',
        modifiers.outside && 'text-muted-foreground',
        modifiers.selected &&
          'bg-primary text-primary-foreground hover:bg-primary-solid-hover',
        modifiers.disabled &&
          'pointer-events-none border-transparent text-disabled-foreground',
        className
      )}
    />
  )
}
