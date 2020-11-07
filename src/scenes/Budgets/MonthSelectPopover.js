import React, { useState } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import { withStyles } from '@material-ui/core/styles'
import {
  Box,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { formatDate } from 'helpers/format'

const StyledListItem = withStyles(theme => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    border: ({ isCurrent }) =>
      isCurrent ? `1px solid ${theme.palette.primary.main}` : '',
  },
}))(({ isCurrent, ...rest }) => <ListItem {...rest} />)

export default function MonthSelectPopover(props) {
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
  const isMonthDisabled = month => {
    if (disablePast && month < curMonth) return true
    if (minMonth && month < minMonth) return true
    if (maxMonth && month > maxMonth) return true
    return false
  }
  const isNextYearDisabled = maxMonth && months[months.length - 1] >= maxMonth
  const isPrevYearDisabled = minMonth && months[0] <= minMonth
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

        <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" clone>
          <List>
            {months.map(month => (
              <StyledListItem
                key={+month}
                isCurrent={month === curMonth}
                disabled={isMonthDisabled(month)}
                selected={month === value}
                onClick={() => onChange(month)}
                button
              >
                <Box textAlign="center" clone>
                  <ListItemText>
                    {formatDate(month, 'LLL').toUpperCase()}
                  </ListItemText>
                </Box>
              </StyledListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Popover>
  )
}
