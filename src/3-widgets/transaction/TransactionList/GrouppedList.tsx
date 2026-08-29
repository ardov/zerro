import type { FC } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'
import { List } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { ListRowSubheader } from '6-shared/ui/ListRow'
import { formatDate } from '6-shared/helpers/date'
import type { TDateDraft, TISODate, TTransactionId } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { SmartDialog } from '6-shared/ui/SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import { useTranslation } from 'react-i18next'

type GroupNode = {
  date: TISODate
  ids: TTransactionId[]
}

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const groupHeight = (group: GroupNode) =>
  HEADER_HEIGHT + TRANSACTION_HEIGHT * group.ids.length

/** Index of the first group at or before `date` (groups are newest-first). */
const findDateIndex = (groups: GroupNode[], date: TISODate) => {
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
  renderTransaction: (id: TTransactionId) => React.ReactNode
  initialDate?: TDateDraft
  restoredTopDate?: TISODate | null
  onTopDateChange?: (date: TISODate) => void
}

export const GrouppedList: FC<GrouppedListProps> = props => {
  const {
    groups,
    renderTransaction,
    initialDate,
    restoredTopDate,
    onTopDateChange,
  } = props
  const listRef = useRef<ListImperativeAPI>(null)
  const datePopover = dateDialog.useMethods()

  // react-window v2 offsets rows with `transform: translateY(...)`, which
  // breaks `position: sticky` on the in-row headers. So we render the pinned
  // header as an overlay driven by the scroll position instead, including the
  // classic "push" where the next day's header nudges the current one up.
  // The page controller receives the *top visible date* rather than a pixel
  // offset: the list can have a different height after data changes, so a raw
  // scrollTop could land in the wrong place — or past the content. A date is
  // stable and maps back through `scrollToDate`.
  const [scrollTop, setScrollTop] = useState(() => {
    if (!restoredTopDate || !groups.length) return 0
    // Offset of the saved group, so the overlay header is correct on the first
    // paint (it matches where `scrollToDate` will land below).
    const idx = findDateIndex(groups, restoredTopDate)
    let sum = 0
    for (let i = 0; i < idx; i++) sum += groupHeight(groups[i])
    return sum
  })

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
      if (!groups.length) return
      const idx = findDateIndex(groups, toISODate(date))
      listRef.current?.scrollToRow({ index: idx, align: 'start' })
    },
    [groups]
  )

  const onDateClick = useCallback(
    (date: TISODate) => {
      datePopover.open({
        value: date,
        minDate: groups[groups.length - 1]?.date,
        maxDate: groups[0]?.date,
        // Closing is handled inside `DateDialog` via its own (fresh) onClose —
        // the `close` captured here is stale (the dialog isn't on the history
        // stack yet at click time), so calling it would be a no-op.
        onChange: scrollToDate,
      })
    },
    [datePopover, groups, scrollToDate]
  )

  // Position the list once, after react-window has actually mounted and
  // measured its rows (that's when `element` and `scrollToRow` become usable).
  // `onRowsRendered` fires on every render, so guard it to run a single time.
  // `initialDate` ("jump to this date") wins over a restored scroll position.
  const positionedRef = useRef(false)
  const applyInitialPosition = useCallback(() => {
    if (positionedRef.current) return
    positionedRef.current = true
    // Defer to the next frame: `onRowsRendered` fires before react-window has
    // attached its imperative handle (so `element` is still null here), and
    // react-window also syncs its own scroll offset to 0 right after mount.
    // By the next frame the element exists and its offset is settled.
    requestAnimationFrame(() => {
      if (!listRef.current?.element) return
      if (initialDate) {
        scrollToDate(initialDate)
      } else if (restoredTopDate) {
        scrollToDate(restoredTopDate)
      }
    })
  }, [initialDate, restoredTopDate, scrollToDate])

  // Re-jump when `initialDate` changes while already mounted — e.g. clicking
  // another point on the analytics chart reuses this list and only updates the
  // prop. The initial mount is handled by `applyInitialPosition` above.
  const prevInitialDate = useRef(initialDate)
  useEffect(() => {
    if (prevInitialDate.current === initialDate) return
    prevInitialDate.current = initialDate
    if (positionedRef.current && initialDate) scrollToDate(initialDate)
  }, [initialDate, scrollToDate])

  const topIndex = findTopIndex(offsets, scrollTop)
  const topDate = groups[topIndex]?.date
  const reportedTopDate = useRef<TISODate | null>(null)
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
                rowProps={{ groups, onDateClick, renderTransaction }}
                rowHeight={i => groupHeight(groups[i])}
                rowComponent={Day}
                onRowsRendered={applyInitialPosition}
                onScroll={e => {
                  const top = e.currentTarget.scrollTop
                  setScrollTop(top)
                  const date = groups[findTopIndex(offsets, top)]?.date
                  if (date && date !== reportedTopDate.current) {
                    reportedTopDate.current = date
                    onTopDateChange?.(date)
                  }
                }}
              />
            )
          }}
        />

        {topDate && (
          <div style={stickyOverlayStyle}>
            <div style={{ ...groupStyle, transform: `translateY(${pushY}px)` }}>
              <ListRowSubheader
                sticky
                style={{ pointerEvents: 'auto' }}
                onClick={() => onDateClick(topDate)}
              >
                {formatDate(topDate)}
              </ListRowSubheader>
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
  renderTransaction: (id: TTransactionId) => React.ReactNode
}
const Day = (props: RowComponentProps<DayData>): React.ReactElement => {
  const { index, style, groups, onDateClick, renderTransaction } = props
  const group = groups[index]
  return (
    <div style={{ ...groupStyle, ...style }}>
      {/* Sticky is handled by the overlay header in GrouppedList, because
          react-window's row transform breaks native `position: sticky`. */}
      <ListRowSubheader onClick={() => onDateClick(group.date)}>
        {formatDate(group.date)}
      </ListRowSubheader>

      {group.ids.map(renderTransaction)}
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
  value: TISODate
  minDate?: TISODate
  maxDate?: TISODate
  onChange: (date: TISODate) => void
}

const dateDialog = registerPopover<TDateDialogProps>('listSateDialog', {
  value: toISODate(new Date()),
  onChange: () => {},
})

const DateDialog = () => {
  const { t } = useTranslation('transaction')
  const { extraProps, displayProps } = dateDialog.useProps()
  const { onChange, value, minDate, maxDate } = extraProps
  return (
    <SmartDialog elKey={dateDialog.key}>
      <div className="w-[280px] p-4">
        <OutlinedField
          autoFocus
          type="date"
          label={t('date')}
          value={value}
          min={minDate}
          max={maxDate}
          fullWidth
          onChange={event => {
            const date = event.target.value
            if (!date) return
            displayProps.onClose()
            onChange(date as TISODate)
          }}
        />
      </div>
    </SmartDialog>
  )
}
