import React, { useState, useRef, useCallback, FC } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import add from 'date-fns/add'
import sub from 'date-fns/sub'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonBase,
  PaperProps,
} from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { styled } from '@material-ui/styles'
import MonthSelectPopover from './MonthSelectPopover'
import { formatDate } from 'helpers/format'

type MonthSelectProps = PaperProps & {
  onChange: (month: number) => void
  minMonth: number
  maxMonth: number
  value: number
}

export const MonthSelect: FC<MonthSelectProps> = props => {
  const { onChange, minMonth, maxMonth, value, ...rest } = props
  const paperRef = useRef(null)
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
      <Paper ref={paperRef} {...rest}>
        <Box display="flex" px={0.5} py={1}>
          <Box alignSelf="center" flexShrink={0}>
            <IconButton
              children={<ChevronLeftIcon />}
              onClick={() => prevMonth && onChange(prevMonth)}
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

          <Box alignSelf="center" flexShrink={0}>
            <IconButton
              children={<ChevronRightIcon />}
              onClick={() => nextMonth && onChange(nextMonth)}
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

const MonthButton = styled(ButtonBase)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  flexGrow: 1,
  flexShrink: 1,
  minWidth: 0,
  padding: theme.spacing(0.5, 1),
  justifyContent: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
}))

function getMonthName(month: number | Date) {
  // const isCurrentYear =
  //   new Date().getFullYear() === new Date(month).getFullYear()
  // const pattern = isCurrentYear ? 'LLLL' : 'LLLL yyyy'
  // return formatDate(month, pattern).toUpperCase()
  return formatDate(month, 'LLLL').toUpperCase()
}
