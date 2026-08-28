import { IconButton } from './Button'
import { useState } from 'react'
import type { PopoverProps } from '@mui/material'
import { List, ListItemButton, ListItemText, Popover } from '@mui/material'
import { ChevronRightIcon, ChevronLeftIcon } from '6-shared/ui/Icons'
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
  const { onChange, disablePast, minMonth, maxMonth, ...rest } = props
  const value = props.value ? toISOMonth(props.value) : null
  const start = minMonth ? toISOMonth(minMonth) : null
  const end = maxMonth ? toISOMonth(maxMonth) : null
  const [year, setYear] = useState(
    // eslint-disable-next-line react-hooks/purity -- initial state only, sampled once on mount
    new Date(value || Date.now()).getFullYear()
  )
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
    <Popover {...rest}>
      <div className="px-2 pt-2">
        <div className="flex items-center justify-between">
          <IconButton
            children={<ChevronLeftIcon />}
            onClick={() => setYear(year => year - 1)}
            disabled={isPrevYearDisabled}
          />
          <div className="text-center text-2xl">{year}</div>
          <IconButton
            children={<ChevronRightIcon />}
            onClick={() => setYear(year => year + 1)}
            disabled={isNextYearDisabled}
          />
        </div>

        <List className="grid grid-cols-3">
          {months.map(month => (
            <ListItemButton
              key={month}
              sx={{
                borderRadius: 1,
                border: theme =>
                  month === curMonth
                    ? `1px solid ${theme.palette.primary.main}`
                    : 'none',
              }}
              disabled={isMonthDisabled(month)}
              selected={month === value}
              onClick={() => onChange(month)}
            >
              <ListItemText className="text-center">
                {formatDate(month, 'LLL').toUpperCase()}
              </ListItemText>
            </ListItemButton>
          ))}
        </List>
      </div>
    </Popover>
  )
}
