import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { useTranslation } from 'react-i18next'
import { isPlainKey } from '@/6-shared/helpers/keyboard'
import { isMonthGridKey, nextMonth } from './monthNavigation'
import { formatDate, toISOMonth } from '@/6-shared/helpers/date'
import type { TISOMonth } from '@/6-shared/types'
import { ChevronLeftIcon, ChevronRightIcon } from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { IconButton } from './Button'
import {
  calendarCellClass,
  calendarNavClass,
  calendarCaptionClass,
} from './CalendarParts'
import './Calendar.css'

export type MonthPickerHandle = {
  /** Focus the current keyboard entry point in the month grid. */
  focus: () => void
}

export type MonthPickerProps = {
  ref?: Ref<MonthPickerHandle>
  value: TISOMonth | null
  onChange: (month: TISOMonth) => void
  minMonth?: TISOMonth
  maxMonth?: TISOMonth
  className?: string
}

/** Controlled month selection. The caller owns its surface and dismissal. */
export function MonthPicker(props: MonthPickerProps) {
  const { ref, value, onChange, minMonth, maxMonth, className } = props
  const { t } = useTranslation()
  const today = toISOMonth(new Date())
  const clamp = (month: TISOMonth) =>
    minMonth && month < minMonth
      ? minMonth
      : maxMonth && month > maxMonth
        ? maxMonth
        : month
  const initial = clamp(value ?? today)
  const [view, setView] = useState(() => ({
    value,
    minMonth,
    maxMonth,
    year: yearOf(initial),
    focused: initial,
  }))
  const [transition, setTransition] = useState<{
    previous: number
    direction: number
  } | null>(null)
  if (
    view.value !== value ||
    view.minMonth !== minMonth ||
    view.maxMonth !== maxMonth
  ) {
    const next = clamp(value ?? view.focused)
    setTransition(null)
    setView({
      ...view,
      value,
      minMonth,
      maxMonth,
      year: yearOf(next),
      focused: next,
    })
  }
  const root = useRef<HTMLDivElement>(null)
  const focus = useCallback(() => {
    root.current
      ?.querySelector<HTMLButtonElement>('[data-month][tabindex="0"]')
      ?.focus()
  }, [])
  useImperativeHandle(ref, () => ({ focus }), [focus])
  const focusAfterNavigation = useRef(false)
  useLayoutEffect(() => {
    if (!focusAfterNavigation.current) return
    focusAfterNavigation.current = false
    focus()
  }, [view.year, view.focused, focus])
  const disabled = (month: TISOMonth) =>
    Boolean((minMonth && month < minMonth) || (maxMonth && month > maxMonth))
  const monthsOf = (year: number) =>
    Array.from({ length: 12 }, (_, index) => toISOMonth(new Date(year, index)))
  const months = monthsOf(view.year)
  const focusMonth =
    months.find(month => month === view.focused && !disabled(month)) ??
    months.find(month => !disabled(month))
  const navigate = (direction: number) => {
    setTransition({ previous: view.year, direction })
    setView(current => ({ ...current, year: current.year + direction }))
  }
  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const month = (event.target as HTMLElement).dataset.month as
      TISOMonth | undefined
    if (!month || !isPlainKey(event) || !isMonthGridKey(event.key)) return
    event.preventDefault()
    const next = nextMonth(month, event.key, { minMonth, maxMonth })
    if (!next) return
    focusAfterNavigation.current = true
    setTransition(null)
    setView(current => ({ ...current, year: yearOf(next), focused: next }))
  }
  const cells = (year: number, outgoing = false) =>
    monthsOf(year).map(month => (
      <button
        type="button"
        key={month}
        data-month={month}
        className={cn(
          calendarCellClass({
            selected: month === value,
            current: month === today,
            disabled: disabled(month),
          }),
          'px-4'
        )}
        disabled={disabled(month)}
        tabIndex={!outgoing && month === focusMonth ? 0 : -1}
        aria-pressed={month === value}
        onFocus={
          outgoing
            ? undefined
            : () => setView(current => ({ ...current, focused: month }))
        }
        onClick={outgoing ? undefined : () => onChange(month)}
      >
        <span className="first-letter:uppercase">
          {formatDate(month, 'LLL')}
        </span>
      </button>
    ))
  return (
    <div
      ref={root}
      className={cn(
        'kit-calendar w-max max-w-full p-1 text-ui-primary',
        className
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-y-2">
        <IconButton
          size="lg"
          variant="ghost"
          tooltip={false}
          label={t('previousYear')}
          className={calendarNavClass}
          disabled={Boolean(minMonth && view.year <= yearOf(minMonth))}
          onClick={() => navigate(-1)}
        >
          <ChevronLeftIcon />
        </IconButton>
        <div
          className={cn(calendarCaptionClass, 'relative overflow-hidden')}
          aria-live="polite"
        >
          {transition !== null && (
            <span
              aria-hidden
              className={cn(
                'absolute',
                transition.direction > 0
                  ? 'kit-calendar-before-exit'
                  : 'kit-calendar-after-exit'
              )}
            >
              {transition.previous}
            </span>
          )}
          <span
            key={view.year}
            className={cn(
              transition !== null &&
                (transition.direction > 0
                  ? 'kit-calendar-after-enter'
                  : 'kit-calendar-before-enter')
            )}
          >
            {view.year}
          </span>
        </div>
        <IconButton
          size="lg"
          variant="ghost"
          tooltip={false}
          label={t('nextYear')}
          className={calendarNavClass}
          disabled={Boolean(maxMonth && view.year >= yearOf(maxMonth))}
          onClick={() => navigate(1)}
        >
          <ChevronRightIcon />
        </IconButton>
        <div className="relative col-span-3">
          {transition !== null && (
            <div
              key={`old-${transition.previous}`}
              inert
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 grid grid-cols-3',
                transition.direction > 0
                  ? 'kit-calendar-before-exit'
                  : 'kit-calendar-after-exit'
              )}
            >
              {cells(transition.previous, true)}
            </div>
          )}
          <div
            key={view.year}
            role="group"
            onKeyDown={handleKeys}
            aria-label={t('selectMonth')}
            className={cn(
              'grid grid-cols-3',
              transition !== null &&
                (transition.direction > 0
                  ? 'kit-calendar-after-enter'
                  : 'kit-calendar-before-enter')
            )}
            onAnimationEnd={event => {
              if (event.target === event.currentTarget) setTransition(null)
            }}
          >
            {cells(view.year)}
          </div>
        </div>
      </div>
    </div>
  )
}

function yearOf(month: TISOMonth) {
  return Number(month.slice(0, 4))
}
