import { ButtonBase, IconButton } from './Button'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, type PopoverProps } from './Popover'
import { ChevronRightIcon, ChevronLeftIcon } from './Icons'
import { cn } from './shadcn/utils'
import { formatDate, toISOMonth } from '6-shared/helpers/date'
import type { Modify, TDateDraft, TISOMonth } from '6-shared/types'

type MonthSelectPopoverProps = Modify<
  PopoverProps,
  {
    // Rewrite onChange
    onChange: (month: TISOMonth) => void
    // Add other props
    value?: TDateDraft
    minMonth?: TDateDraft
    maxMonth?: TDateDraft
    disablePast?: boolean
  }
>

export default function MonthSelectPopover(props: MonthSelectPopoverProps) {
  const { t } = useTranslation()
  const {
    onChange,
    disablePast,
    minMonth,
    maxMonth,
    value: valueProp,
    ...rest
  } = props
  const value = valueProp ? toISOMonth(valueProp) : null
  const start = minMonth ? toISOMonth(minMonth) : null
  const end = maxMonth ? toISOMonth(maxMonth) : null
  // The year is scoped to one opening, the way the focus target is: a user
  // who paged to 2031 and dismissed without choosing gets the selected
  // month's year back on the next opening, not wherever they wandered to.
  const [opening, setOpening] = useState(() => ({
    open: props.open,
    year: yearOf(value),
  }))
  if (props.open !== opening.open) {
    setOpening({
      open: props.open,
      year: props.open ? yearOf(value) : opening.year,
    })
  }
  const year = opening.year
  const setYear = (next: (year: number) => number) =>
    setOpening(opening => ({ ...opening, year: next(opening.year) }))
  const months: TISOMonth[] = []
  for (let month = 0; month < 12; month++) {
    months.push(toISOMonth(new Date(year, month)))
  }
  const curMonth = toISOMonth(new Date())
  const isMonthDisabled = (month: TISOMonth) => {
    if (disablePast && month < curMonth) return true
    if (start && month < start) return true
    if (end && month > end) return true
    return false
  }
  const isNextYearDisabled = !!end && months[months.length - 1] >= end
  const isPrevYearDisabled = !!start && months[0] <= start
  return (
    <Popover aria-label={t('selectMonth')} {...rest}>
      <div className="px-2 pt-2">
        <div className="flex items-center justify-between">
          <IconButton
            aria-label={t('previousYear')}
            children={<ChevronLeftIcon />}
            onClick={() => setYear(year => year - 1)}
            disabled={isPrevYearDisabled}
          />
          <div className="text-center text-2xl">{year}</div>
          <IconButton
            aria-label={t('nextYear')}
            children={<ChevronRightIcon />}
            onClick={() => setYear(year => year + 1)}
            disabled={isNextYearDisabled}
          />
        </div>

        <div className="grid grid-cols-3 py-2">
          {months.map(month => (
            <ButtonBase
              key={month}
              className={cn(
                'min-w-0 rounded-lg px-4 py-2 text-foreground hover:bg-accent focus-visible:bg-action-focus disabled:opacity-disabled',
                month === value &&
                  'bg-primary-selected hover:bg-primary-selected-hover',
                month === curMonth && 'border border-solid border-primary'
              )}
              disabled={isMonthDisabled(month)}
              aria-pressed={month === value}
              onClick={() => onChange(month)}
            >
              <span className="my-1 min-w-0 flex-auto text-center font-sans type-body">
                {formatDate(month, 'LLL').toUpperCase()}
              </span>
            </ButtonBase>
          ))}
        </div>
      </div>
    </Popover>
  )
}

/** The year a fresh opening starts on: the selected month's, or this one.
 * The clock is read once per opening, and the result is held in state from
 * there, so paging around does not drift with it. */
function yearOf(value: TISOMonth | null) {
  return new Date(value || Date.now()).getFullYear()
}
