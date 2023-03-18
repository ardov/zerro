import React, { useState } from 'react'
import { withStyles } from '@mui/styles'
import {
  Box,
  IconButton,
  Popover,
  List,
  ListItemText,
  PopoverProps,
  ListItemButton,
  ListItemButtonProps,
} from '@mui/material'
import { ChevronRightIcon, ChevronLeftIcon } from '@shared/ui/Icons'
import { formatDate, toISOMonth } from '@shared/helpers/date'
import { Modify, TDateDraft, TISOMonth } from '@shared/types'

interface MonthItemItemProps extends ListItemButtonProps {
  isCurrent: boolean
}

const MonthItem = withStyles(theme => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    border: ({ isCurrent }: MonthItemItemProps) =>
      isCurrent ? `1px solid ${theme.palette.primary.main}` : '',
  },
}))(({ isCurrent, ...rest }: MonthItemItemProps) => (
  <ListItemButton {...rest} />
))

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
  const [year, setYear] = useState(new Date(value || Date.now()).getFullYear())
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
      <Box pt={1} px={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton
            children={<ChevronLeftIcon />}
            onClick={() => setYear(year => --year)}
            disabled={isPrevYearDisabled}
          />
          <Box textAlign="center" fontSize="h5.fontSize" children={year} />
          <IconButton
            children={<ChevronRightIcon />}
            onClick={() => setYear(year => ++year)}
            disabled={isNextYearDisabled}
          />
        </Box>

        <List sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {months.map(month => (
            <MonthItem
              key={month}
              isCurrent={month === curMonth}
              disabled={isMonthDisabled(month)}
              selected={month === value}
              onClick={() => onChange(month)}
            >
              <ListItemText sx={{ textAlign: 'center' }}>
                {formatDate(month, 'LLL').toUpperCase()}
              </ListItemText>
            </MonthItem>
          ))}
        </List>
      </Box>
    </Popover>
  )
}
