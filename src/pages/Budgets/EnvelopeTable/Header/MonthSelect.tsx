import React, { useState, useRef, useCallback, FC } from 'react'
import { Box, Typography, IconButton, ButtonBase } from '@mui/material'
import { BoxProps } from '@mui/system'
import { TDateDraft, TISOMonth } from '@shared/types'
import { ChevronRightIcon, ChevronLeftIcon } from '@shared/ui/Icons'
import MonthSelectPopover from '@shared/ui/MonthSelectPopover'
import { formatDate } from '@shared/helpers/date'
import { useMonth } from '@shared/hooks/useMonth'
import { nextMonth, prevMonth } from '@shared/helpers/date'
import { useMonthList } from '@entities/envelopeData'

export const MonthSelect: FC<BoxProps> = props => {
  const [month, setMonth] = useMonth()
  const list = useMonthList()
  const first = list[0]
  const last = list[list.length - 1]

  const paperRef = useRef(null)
  const [anchorEl, setAnchorEl] = useState(null)

  const prevMonthDate = month > first ? prevMonth(month) : null
  const nextMonthDate = month < last ? nextMonth(month) : null
  const isFirst = !prevMonthDate
  const isLast = !nextMonthDate
  const goPrevMonth = () => prevMonthDate && setMonth(prevMonthDate)
  const goNextMonth = () => nextMonthDate && setMonth(nextMonthDate)
  const openPopover = useCallback(
    () => setAnchorEl(paperRef.current),
    [setAnchorEl]
  )
  const closePopover = useCallback(() => setAnchorEl(null), [setAnchorEl])
  const handleChange = useCallback(
    (date: TISOMonth) => {
      closePopover()
      setMonth(date)
    },
    [closePopover, setMonth]
  )

  return (
    <>
      <Box ref={paperRef} sx={{ display: 'flex' }} {...props}>
        <ButtonBase
          sx={{ borderRadius: 1, py: 1, pl: 1 }}
          onClick={openPopover}
        >
          <Typography variant="body1" noWrap>
            <b>{getMonthName(month)}</b> {getYear(month)}
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
      </Box>

      <MonthSelectPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePopover}
        value={month}
        minMonth={first}
        maxMonth={last}
        onChange={handleChange}
      />
    </>
  )
}

function getMonthName(month: TDateDraft) {
  return formatDate(month, 'LLL').toUpperCase().slice(0, 3)
}
function getYear(month: TDateDraft) {
  return new Date(month).getFullYear()
}
