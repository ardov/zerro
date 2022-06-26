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
import { ChevronRightIcon, ChevronLeftIcon } from 'shared/ui/Icons'
import { formatDate } from 'shared/helpers/format'
import { TDateDraft, TISOMonth } from 'shared/types'
import { toISOMonth } from 'shared/helpers/adapterUtils'

interface MonthItemItemProps extends ListItemButtonProps {
  isCurrent: boolean
}

const MonthItem = withStyles(theme => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    border: ({ isCurrent }: MonthItemItemProps) =>
      isCurrent ? `1px solid ${theme.palette.primary.main}` : '',
  },
  // Wrapper causes type error. Here is similar problem https://stackoverflow.com/questions/62223353/error-creating-wrapped-component-with-typescript-and-material-ui-listitem
  // @ts-ignore
}))(({ isCurrent, ...rest }: MonthItemItemProps) => (
  <ListItemButton {...rest} />
))

interface MonthSelectPopoverProps extends Omit<PopoverProps, 'onChange'> {
  onChange: (month: TISOMonth) => void
  value?: TDateDraft
  minMonth?: TDateDraft
  maxMonth?: TDateDraft
  disablePast?: boolean
}
export default function MonthSelectPopover(props: MonthSelectPopoverProps) {
  const { onChange, disablePast, ...rest } = props
  const value = props.value ? toISOMonth(props.value) : null
  const minMonth = props.minMonth ? toISOMonth(props.minMonth) : null
  const maxMonth = props.maxMonth ? toISOMonth(props.maxMonth) : null
  const [year, setYear] = useState(new Date(value || Date.now()).getFullYear())
  const months: TISOMonth[] = []
  for (let month = 0; month < 12; month++) {
    months.push(toISOMonth(new Date(year, month)))
  }
  const curMonth = toISOMonth(new Date())
  const isMonthDisabled = (month: TISOMonth) => {
    if (disablePast && month < curMonth) return true
    if (minMonth && month < minMonth) return true
    if (maxMonth && month > maxMonth) return true
    return false
  }
  const isNextYearDisabled = !!maxMonth && months[months.length - 1] >= maxMonth
  const isPrevYearDisabled = !!minMonth && months[0] <= minMonth
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
                {formatDate(new Date(month), 'LLL').toUpperCase()}
              </ListItemText>
            </MonthItem>
          ))}
        </List>
      </Box>
    </Popover>
  )
}
