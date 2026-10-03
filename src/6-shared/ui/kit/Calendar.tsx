import { useState, type ButtonHTMLAttributes } from 'react'
import { eachMonthOfInterval } from 'date-fns'
import {
  DayButton,
  DayPicker,
  Month,
  MonthCaption,
  useDayPicker,
  type ChevronProps,
  type ClassNames,
  type DayButtonProps,
  type Matcher,
  type MonthProps,
  type MonthCaptionProps,
} from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import {
  formatDate,
  getDateLocale,
  parseDate,
  toISODate,
} from '@/6-shared/helpers/date'
import type { TISODate } from '@/6-shared/types'
import { ChevronLeftIcon, ChevronRightIcon } from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Button, IconButton } from './Button'
import { Select } from './Select'
import {
  calendarCellClass,
  calendarNavClass,
  calendarCaptionClass,
} from './CalendarParts'
import './Calendar.css'

export type CalendarProps = {
  value: TISODate | null
  onChange: (date: TISODate) => void
  minDate?: TISODate
  maxDate?: TISODate
  /** Initial month for an empty calendar; otherwise starts at the selection. */
  defaultMonth?: TISODate
  /** Focus the selected (or first available) day when opening from a keyboard. */
  autoFocus?: boolean
  className?: string
}

/** Single-date grid. Its parent owns the surrounding surface and dismissal. */
export function Calendar(props: CalendarProps) {
  const {
    value,
    onChange,
    minDate,
    maxDate,
    defaultMonth,
    autoFocus,
    className,
  } = props
  const { t } = useTranslation()
  const selected = value ? parseDate(value) : undefined
  const min = minDate ? parseDate(minDate) : undefined
  const max = maxDate ? parseDate(maxDate) : undefined
  const disabled: Matcher[] = []
  if (min) disabled.push({ before: min })
  if (max) disabled.push({ after: max })

  const [shown, setShown] = useState(() => ({
    value,
    month: selected ?? (defaultMonth ? parseDate(defaultMonth) : new Date()),
  }))
  // An external selection follows its month. Clearing keeps the browsed month.
  if (shown.value !== value) {
    setShown({ value, month: selected ?? shown.month })
  }

  return (
    <DayPicker
      mode="single"
      required
      selected={selected}
      onSelect={date => onChange(toISODate(date))}
      month={shown.month}
      onMonthChange={month => setShown(current => ({ ...current, month }))}
      startMonth={min}
      endMonth={max}
      disabled={disabled}
      autoFocus={autoFocus}
      locale={getDateLocale()}
      navLayout="around"
      showOutsideDays
      fixedWeeks
      animate
      className={cn(
        'kit-calendar w-86 max-w-full p-1 text-ui-primary',
        className
      )}
      classNames={classNames}
      components={components}
      labels={{
        labelPrevious: () => t('previousMonth'),
        labelNext: () => t('nextMonth'),
        labelDayButton: (date, modifiers) =>
          modifiers.today
            ? `${t('today')}, ${formatDate(date, 'PPPP')}`
            : formatDate(date, 'PPPP'),
      }}
    />
  )
}

const classNames: Partial<ClassNames> = {
  month: 'grid w-full grid-cols-[auto_1fr_auto] items-center gap-y-2',
  month_caption: calendarCaptionClass,
  caption_label: 'truncate text-ui-16 font-medium first-letter:uppercase',
  month_grid: 'col-span-3 w-full table-fixed border-collapse',
  weekday:
    'h-8 text-center text-ui-14 font-normal text-ui-secondary select-none',
  // At navigation bounds DayPicker hides outside days; even empty weeks keep height.
  week: 'h-12',
  day: 'p-0 text-center',
  weeks_before_enter: 'kit-calendar-before-enter',
  weeks_before_exit: 'kit-calendar-before-exit',
  weeks_after_enter: 'kit-calendar-after-enter',
  weeks_after_exit: 'kit-calendar-after-exit',
  caption_before_enter: 'kit-calendar-before-enter',
  caption_before_exit: 'kit-calendar-before-exit',
  caption_after_enter: 'kit-calendar-after-enter',
  caption_after_exit: 'kit-calendar-after-exit',
}

function CalendarMonth(props: MonthProps) {
  return (
    <Month
      {...props}
      onAnimationStart={event => {
        // DayPicker hides its outgoing DOM snapshot from screen readers, but
        // leaves cloned buttons tabbable. Exclude it from keyboard input too.
        const outgoing = event.currentTarget.querySelector<HTMLElement>(
          '[data-animated-month][aria-hidden="true"]'
        )
        if (outgoing) outgoing.inert = true
      }}
    />
  )
}

function CalendarMonthCaption(props: MonthCaptionProps) {
  const { calendarMonth, children, ...restProps } = props
  const { goToMonth, dayPickerProps } = useDayPicker()
  const { t } = useTranslation()
  const month = calendarMonth.date
  const year = month.getFullYear()
  const caption = formatDate(month, 'LLLL')
  const start = dayPickerProps.startMonth
  const end = dayPickerProps.endMonth
  const months = eachMonthOfInterval({
    start: start?.getFullYear() === year ? start : new Date(year, 0),
    end: end?.getFullYear() === year ? end : new Date(year, 11),
  }).map(date => ({ value: toISODate(date), label: formatDate(date, 'LLLL') }))
  const firstYear = start?.getFullYear() ?? year - 5
  const lastYear = end?.getFullYear() ?? year + 5
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => ({
      value: String(firstYear + index),
      label: String(firstYear + index),
    })
  )

  return (
    <MonthCaption {...restProps} calendarMonth={calendarMonth}>
      <Select
        label={t('selectMonth')}
        value={toISODate(month)}
        onChange={value => {
          if (value) goToMonth(parseDate(value))
        }}
        items={months}
        required
        size="sm"
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${t('selectMonth')}: ${caption}`}
            className="max-w-full rounded-smooth px-2"
          >
            <span className="truncate first-letter:uppercase">{caption}</span>
          </Button>
        }
      />
      <Select
        label={t('selectYear')}
        value={String(year)}
        onChange={value => {
          if (value) goToMonth(new Date(Number(value), month.getMonth(), 1))
        }}
        items={years}
        required
        size="sm"
        trigger={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${t('selectYear')}: ${year}`}
            className="tabular-nums"
          >
            {year}
          </Button>
        }
      />
      <span className="sr-only">{children}</span>
    </MonthCaption>
  )
}

function CalendarNavButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { 'aria-label': label, className, ...restProps } = props
  return (
    <IconButton
      {...restProps}
      label={label!}
      tooltip={false}
      variant="ghost"
      size="lg"
      className={cn(calendarNavClass, className)}
    />
  )
}

function CalendarChevron(props: ChevronProps) {
  const { orientation, className } = props
  const Icon = orientation === 'left' ? ChevronLeftIcon : ChevronRightIcon
  return <Icon className={className} />
}

function CalendarDay(props: DayButtonProps) {
  const { modifiers, className, ...restProps } = props
  return (
    <DayButton
      {...restProps}
      modifiers={modifiers}
      className={cn(
        calendarCellClass({
          selected: modifiers.selected,
          current: modifiers.today,
          disabled: modifiers.disabled,
          outside: modifiers.outside,
        }),
        className
      )}
    />
  )
}

const components = {
  Month: CalendarMonth,
  MonthCaption: CalendarMonthCaption,
  Chevron: CalendarChevron,
  PreviousMonthButton: CalendarNavButton,
  NextMonthButton: CalendarNavButton,
  DayButton: CalendarDay,
}
