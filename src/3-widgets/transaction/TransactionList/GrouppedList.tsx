import type { FC } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'
import { List } from 'react-window'
import type { StaticDatePickerProps } from '@mui/x-date-pickers/StaticDatePicker'
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { ListSubheader } from '@mui/material'
import { formatDate, parseDate } from '6-shared/helpers/date'
import type { TDateDraft, TISODate } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { SmartDialog } from '6-shared/ui/SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'

type GroupNode = {
  date: TISODate
  transactions: React.JSX.Element[]
}

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const groupHeight = (group: GroupNode) =>
  HEADER_HEIGHT + TRANSACTION_HEIGHT * group.transactions.length

const findDateIndex = (groups: GroupNode[], date: GroupNode['date']) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}

/** Index of the last group whose top offset is at or above `scrollTop`. */
const findTopIndex = (offsets: number[], scrollTop: number) => {
  let lo = 0
  let hi = offsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (offsets[mid] <= scrollTop) lo = mid
    else hi = mid - 1
  }
  return lo
}

type GrouppedListProps = {
  groups: GroupNode[]
  initialDate?: TDateDraft
}

export const GrouppedList: FC<GrouppedListProps> = props => {
  const { groups, initialDate } = props
  const listRef = useRef<ListImperativeAPI>(null)
  const datePopover = dateDialog.useMethods()

  // react-window v2 offsets rows with `transform: translateY(...)`, which
  // breaks `position: sticky` on the in-row headers. So we render the pinned
  // header as an overlay driven by the scroll position instead, including the
  // classic "push" where the next day's header nudges the current one up.
  const [scrollTop, setScrollTop] = useState(0)

  // Prefix sum of group tops: offsets[i] is the y where group i starts.
  const offsets = useMemo(() => {
    const acc: number[] = []
    let sum = 0
    for (const group of groups) {
      acc.push(sum)
      sum += groupHeight(group)
    }
    return acc
  }, [groups])

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

  const topIndex = findTopIndex(offsets, scrollTop)
  const topDate = groups[topIndex]?.date
  // Distance from the list top to the next day's header. Once it enters the
  // header band, push the pinned header up so the two swap seamlessly.
  const nextHeaderTop = (offsets[topIndex + 1] ?? Infinity) - scrollTop
  const pushY = Math.min(0, nextHeaderTop - HEADER_HEIGHT)

  return (
    <>
      <DateDialog />
      <div style={{ position: 'relative', height: '100%' }}>
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
                rowHeight={i => groupHeight(groups[i])}
                rowComponent={Day}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
              />
            )
          }}
        />

        {topDate && (
          <div style={stickyOverlayStyle}>
            <div style={{ ...groupStyle, transform: `translateY(${pushY}px)` }}>
              <ListSubheader
                style={{ pointerEvents: 'auto' }}
                onClick={() => onDateClick(topDate)}
              >
                {formatDate(topDate)}
              </ListSubheader>
            </div>
          </div>
        )}
      </div>
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
      {/* Sticky is handled by the overlay header in GrouppedList, because
          react-window's row transform breaks native `position: sticky`. */}
      <ListSubheader disableSticky onClick={() => onDateClick(date)}>
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

const stickyOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',
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
