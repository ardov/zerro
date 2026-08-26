import type { FC, HTMLAttributes } from 'react'
import { useState, useRef, useCallback } from 'react'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { IconButton, ButtonBase } from '@mui/material'
import type { TDateDraft, TISOMonth } from '6-shared/types'
import { ChevronRightIcon, ChevronLeftIcon } from '6-shared/ui/Icons'
import MonthSelectPopover from '6-shared/ui/MonthSelectPopover'
import { formatDate } from '6-shared/helpers/date'
import { nextMonth, prevMonth } from '6-shared/helpers/date'

import { useMonth } from '../../MonthProvider'

export const MonthSelect: FC<HTMLAttributes<HTMLDivElement>> = props => {
  const [month, setMonth] = useMonth()
  const list = useAppSelector(core.months.selectList)
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
      <div ref={paperRef} className="flex" {...props}>
        <ButtonBase className="rounded-lg py-2 pl-2" onClick={openPopover}>
          <p className="m-0 truncate type-body font-sans">
            <b>{getMonthName(month)}</b> {getYear(month)}
          </p>
        </ButtonBase>

        <div className="flex">
          <IconButton
            onClick={goPrevMonth}
            disabled={isFirst}
            className="text-muted-foreground"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={goNextMonth}
            disabled={isLast}
            className="-ml-2 text-muted-foreground"
          >
            <ChevronRightIcon />
          </IconButton>
        </div>
      </div>

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
