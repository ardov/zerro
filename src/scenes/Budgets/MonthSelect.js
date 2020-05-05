import React, { useState, useRef, useCallback } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import add from 'date-fns/add'
import sub from 'date-fns/sub'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonBase,
} from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { withStyles } from '@material-ui/core/styles'
import MonthSelectPopover from './MonthSelectPopover'

const MonthButton = withStyles(theme => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    flexGrow: '1',
    flexShrink: '1',
    minWidth: '0',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    justifyContent: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
  },
}))(ButtonBase)

export default function MonthSelect({ onChange, minMonth, maxMonth, value }) {
  const paperRef = useRef()
  const year = new Date(value).getFullYear()
  const [anchorEl, setAnchorEl] = useState(null)
  const prevMonth = value > minMonth ? +sub(value, { months: 1 }) : null
  const nextMonth = value < maxMonth ? +add(value, { months: 1 }) : null

  const openPopover = useCallback(() => setAnchorEl(paperRef.current), [
    setAnchorEl,
  ])
  const closePopover = useCallback(() => setAnchorEl(null), [setAnchorEl])
  const handleChange = useCallback(
    date => {
      closePopover()
      onChange(+startOfMonth(date))
    },
    [closePopover, onChange]
  )

  return (
    <>
      <Paper ref={paperRef}>
        <Box display="flex" px={0.5} py={1}>
          <Box alignSelf="center" flexShrink="0">
            <IconButton
              children={<ChevronLeftIcon />}
              onClick={() => onChange(prevMonth)}
              disabled={!prevMonth}
            />
          </Box>

          <MonthButton onClick={openPopover}>
            <Typography variant="h5" noWrap>
              {getMonthName(value)}
            </Typography>
            <Typography variant="body2" color="textSecondary" noWrap>
              {year}
            </Typography>
          </MonthButton>

          <Box alignSelf="center" flexShrink="0">
            <IconButton
              children={<ChevronRightIcon />}
              onClick={() => onChange(nextMonth)}
              disabled={!nextMonth}
            />
          </Box>
        </Box>
      </Paper>

      <MonthSelectPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePopover}
        value={value}
        minMonth={minMonth}
        maxMonth={maxMonth}
        onChange={handleChange}
      />
    </>
  )
}

function getMonthName(month) {
  // const isCurrentYear =
  //   new Date().getFullYear() === new Date(month).getFullYear()
  // const pattern = isCurrentYear ? 'LLLL' : 'LLLL yyyy'
  // return format(month, pattern, { locale: ru }).toUpperCase()
  return format(month, 'LLLL', { locale: ru }).toUpperCase()
}
