import React, { useState } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
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
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

export default function MonthSelectPopover(props) {
  const { minMonth, maxMonth, onChange, ...rest } = props
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
              <Box
                key={+month}
                borderRadius="borderRadius"
                border={month === curMonth ? 1 : 0}
                borderColor={month === curMonth ? 'primary.main' : ''}
                clone
              >
                <ListItem
                  disabled={isMonthDisabled(month)}
                  selected={month === value}
                  onClick={() => onChange(month)}
                  button
                >
                  <Box textAlign="center" clone>
                    <ListItemText>
                      {format(month, 'LLL', { locale: ru }).toUpperCase()}
                    </ListItemText>
                  </Box>
                </ListItem>
              </Box>
            ))}
          </List>
        </Box>
      </Box>
    </Popover>
  )
}
