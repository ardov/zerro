import React, { FC, useCallback, useEffect, useRef } from 'react'
import { List, ListImperativeAPI, RowComponentProps } from 'react-window'
import {
  StaticDatePicker,
  StaticDatePickerProps,
} from '@mui/x-date-pickers/StaticDatePicker'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { ListSubheader } from '@mui/material'
import { formatDate, parseDate } from '6-shared/helpers/date'
import { TDateDraft, TISODate } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { SmartDialog } from '6-shared/ui/SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'

type GroupNode = {
  date: TISODate
  transactions: React.JSX.Element[]
}

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const findDateIndex = (groups: GroupNode[], date: GroupNode['date']) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}

type GrouppedListProps = {
  groups: GroupNode[]
  initialDate?: TDateDraft
}

export const GrouppedList: FC<GrouppedListProps> = props => {
  const { groups, initialDate } = props
  const listRef = useRef<ListImperativeAPI>(null)
  const datePopover = dateDialog.useMethods()

  const scrollToDate = useCallback(
    (date: TDateDraft) => {
      const idx = findDateIndex(groups, toISODate(date))
      listRef.current?.scrollToRow({ index: idx, align: 'start' })
    },
    [groups]
  )

  const onDateClick = useCallback(
    (date: TISODate) => {
      datePopover.open({
        value: parseDate(date),
        minDate: parseDate(groups[groups.length - 1]?.date || 0),
        maxDate: parseDate(groups[0]?.date || 0),
        onChange: (d: TDateDraft | null) => {
          if (d) {
            datePopover.close()
            scrollToDate(d as TISODate)
          }
        },
      })
    },
    [datePopover, groups, scrollToDate]
  )

  // Scroll to initial date if it's provided
  // We should render first and only then scroll.
  // That's why there is a timeout. Downside of is that the list jumps.
  useEffect(() => {
    if (initialDate) setTimeout(() => scrollToDate(initialDate), 10)
  }, [initialDate, scrollToDate])

  return (
    <>
      <DateDialog />
      <AutoSizer
        renderProp={({ height }) => {
          if (!height) return null
          return (
            <List
              className="hidden-scroll"
              style={{ height }}
              listRef={listRef}
              rowCount={groups.length}
              rowProps={{ groups, onDateClick }}
              rowHeight={i =>
                HEADER_HEIGHT +
                TRANSACTION_HEIGHT * groups[i].transactions.length
              }
              rowComponent={Day}
            />
          )
        }}
      />
    </>
  )
}

//
//
//
//
//
//

type DayData = {
  groups: GroupNode[]
  onDateClick: (date: TISODate) => void
}
const Day = (props: RowComponentProps<DayData>): React.ReactElement => {
  const { index, style, groups, onDateClick } = props
  const date = groups[index].date
  return (
    <div style={{ ...groupStyle, ...style }}>
      <ListSubheader onClick={() => onDateClick(date)}>
        {formatDate(date)}
      </ListSubheader>

      {groups[index].transactions}
    </div>
  )
}

const groupStyle: React.CSSProperties = {
  position: 'relative',
  maxWidth: 560,
  marginLeft: 'auto',
  marginRight: 'auto',
}

//
//
//
//
//
//

type TDateDialogProps = {
  value: StaticDatePickerProps['value']
  minDate?: StaticDatePickerProps['minDate']
  maxDate?: StaticDatePickerProps['maxDate']
  onChange: StaticDatePickerProps['onChange']
}

const dateDialog = registerPopover<TDateDialogProps>('listSateDialog', {
  value: new Date(),
  onChange: () => {},
})

const DateDialog = () => {
  const { extraProps } = dateDialog.useProps()
  return (
    <SmartDialog elKey={dateDialog.key}>
      <StaticDatePicker {...extraProps} openTo="day" />
    </SmartDialog>
  )
}
