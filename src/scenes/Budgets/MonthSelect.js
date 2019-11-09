import React from 'react'
import { Box, Paper, Typography, IconButton } from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

const getMonthName = date =>
  format(date, 'LLLL yyyy', { locale: ru }).toUpperCase()

export default function MonthSelect({
  months,
  current,
  onChange,
  onSetCurrent,
}) {
  const currentMonth = months[current]
  return (
    <Box display="flex" px={2} py={0.5} alignItems="center" clone>
      <Paper>
        <Box flexGrow={1} clone>
          <Typography onClick={onSetCurrent} noWrap>
            {getMonthName(currentMonth)}
          </Typography>
        </Box>

        <IconButton
          children={<ChevronLeftIcon />}
          onClick={() => onChange(--current)}
          disabled={!current}
        />

        <IconButton
          edge="end"
          children={<ChevronRightIcon />}
          onClick={() => onChange(++current)}
          disabled={current >= months.length - 1}
        />
      </Paper>
    </Box>
  )
}
