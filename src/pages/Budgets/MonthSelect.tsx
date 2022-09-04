import React, { useState, useRef, useCallback, FC } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonBase,
  PaperProps,
} from '@mui/material'
import { styled } from '@mui/styles'
import { ChevronRightIcon, ChevronLeftIcon } from '@shared/ui/Icons'
import MonthSelectPopover from '@shared/ui/MonthSelectPopover'
import { formatDate } from '@shared/helpers/date'
import { Modify, TDateDraft, TISOMonth } from '@shared/types'
import {
  nextMonth,
  parseDate,
  prevMonth,
  toISOMonth,
} from '@shared/helpers/date'

type MonthSelectProps = Modify<
  PaperProps,
  {
    onChange: (month: TISOMonth) => void
    minMonth: TDateDraft
    maxMonth: TDateDraft
    value: TDateDraft
  }
>

export const MonthSelect: FC<MonthSelectProps> = props => {
  const { onChange, minMonth, maxMonth, value, ...rest } = props
  const currDate = parseDate(value)
  const minDate = parseDate(minMonth)
  const maxDate = parseDate(maxMonth)
  const paperRef = useRef(null)
  const [anchorEl, setAnchorEl] = useState(null)

  const prevMonthDate = currDate > minDate ? prevMonth(currDate) : null
  const nextMonthDate = currDate < maxDate ? nextMonth(currDate) : null
  const isFirst = !prevMonthDate
  const isLast = !nextMonthDate
  const goPrevMonth = () => prevMonthDate && onChange(toISOMonth(prevMonthDate))
  const goNextMonth = () => nextMonthDate && onChange(toISOMonth(nextMonthDate))

  const openPopover = useCallback(
    () => setAnchorEl(paperRef.current),
    [setAnchorEl]
  )
  const closePopover = useCallback(() => setAnchorEl(null), [setAnchorEl])
  const handleChange = useCallback(
    (date: TISOMonth) => {
      closePopover()
      onChange(date)
    },
    [closePopover, onChange]
  )

  return (
    <>
      <Paper ref={paperRef} sx={{ display: 'flex' }} {...rest}>
        <ButtonBase
          sx={{ borderRadius: 1, py: 1, pl: 2 }}
          onClick={openPopover}
        >
          <Typography variant="body1" noWrap>
            <b>{getMonthName(currDate)}</b> {currDate.getFullYear()}
          </Typography>
        </ButtonBase>

        <Box>
          <IconButton
            onClick={goPrevMonth}
            disabled={isFirst}
            sx={{ color: 'text.secondary' }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={goNextMonth}
            disabled={isLast}
            sx={{ color: 'text.secondary', ml: -1 }}
          >
            <ChevronRightIcon />
          </IconButton>
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
  // flexGrow: 1,
  // flexShrink: 1,
  // minWidth: 0,
  padding: theme.spacing(0.5, 1),
  // justifyContent: 'flex-start',
  // display: 'flex',
  // flexDirection: 'column',
}))

function getMonthName(month: TDateDraft) {
  return formatDate(month, 'LLL').toUpperCase().slice(0, 3)
}
