import React, { useState } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
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
import { ChevronRightIcon, ChevronLeftIcon } from 'components/Icons'
import { formatDate } from 'shared/helpers/format'

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
  onChange: (month: number) => void
  value?: number
  minMonth?: number
  maxMonth?: number
  disablePast?: boolean
}
export default function MonthSelectPopover(props: MonthSelectPopoverProps) {
  const { minMonth, maxMonth, onChange, disablePast, ...rest } = props
  const value = props.value ? +startOfMonth(props.value) : null
  const [year, setYear] = useState(
    value ? new Date(value).getFullYear() : new Date().getFullYear()
  )
  const months = []
  for (let month = 0; month < 12; month++) {
    months.push(+new Date(year, month))
  }
  const curMonth = +startOfMonth(new Date())
  const isMonthDisabled = (month: number) => {
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
              key={+month}
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
