import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import StaticDatePicker, {
  StaticDatePickerProps,
} from '@mui/lab/StaticDatePicker'
import TextField from '@mui/material/TextField'
import AutoSizer from 'react-virtualized-auto-sizer'
import { ListSubheader } from '@mui/material'
import { formatDate, parseDate } from '@shared/helpers/date'
import { TDateDraft, TISODate } from '@shared/types'
import { toISODate } from '@shared/helpers/date'
import { SmartDialog } from '@shared/ui/SmartDialog'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

type GroupNode = {
  date: TISODate
  transactions: JSX.Element[]
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
  const listRef = useRef<VariableSizeList>(null)
  const datePopover = dateDialog.useMethods()

  useEffect(() => {
    listRef?.current?.resetAfterIndex?.(0)
  }, [listRef, groups])

  const scrollToDate = useCallback(
    (date: TDateDraft) => {
      const idx = findDateIndex(groups, toISODate(date))
      listRef?.current?.scrollToItem(idx, 'start')
    },
    [groups]
  )

  const onDateClick = useCallback(
    (date: TISODate) => {
      datePopover.open({
        value: parseDate(date),
        minDate: parseDate(groups.at(-1)?.date || 0),
        maxDate: parseDate(groups.at(0)?.date || 0),
        onChange: d => {
          datePopover.close()
          scrollToDate(d as TISODate)
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
      <AutoSizer disableWidth>
        {({ height }) => (
          <VariableSizeList
            className="hidden-scroll"
            width="100%"
            height={height}
            ref={listRef}
            useIsScrolling
            itemCount={groups.length}
            itemData={{ groups, onDateClick }}
            itemKey={i => groups[i].date}
            itemSize={i =>
              HEADER_HEIGHT + TRANSACTION_HEIGHT * groups[i].transactions.length
            }
          >
            {Day}
          </VariableSizeList>
        )}
      </AutoSizer>
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
const Day: FC<ListChildComponentProps<DayData>> = props => {
  const { index, style, data, isScrolling } = props
  const { groups, onDateClick } = data
  const renderContent = useRenderState(isScrolling)
  const date = groups[index].date
  const length = groups[index].transactions.length
  return (
    <div style={{ ...groupStyle, ...style }}>
      <ListSubheader onClick={() => onDateClick(date)}>
        {formatDate(date)}
      </ListSubheader>

      {renderContent ? (
        groups[index].transactions
      ) : (
        <TrSkeleton length={length} />
      )}
    </div>
  )
}

const TrSkeleton = (props: { length: number }) => (
  <div
    style={{
      height: props.length * TRANSACTION_HEIGHT,
      background:
        'radial-gradient(circle at 36px 36px, rgba(128,128,128,0.2) 20px,transparent 20px)',
      backgroundSize: '100% 72px',
    }}
  />
)

/** Used to delay rendering of complex components */
const useRenderState = (isScrolling?: boolean, delay = 300) => {
  const [renderContent, setRenderContent] = useState(!isScrolling)
  useEffect(() => {
    if (!isScrolling) setRenderContent(true)
    let timer = setTimeout(() => setRenderContent(true), delay)
    return () => clearTimeout(timer)
  }, [delay, isScrolling])
  return renderContent
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

const dateDialog = makePopoverHooks<TDateDialogProps>('listSateDialog', {
  value: new Date(),
  onChange: () => {},
})

const DateDialog = () => {
  const { extraProps } = dateDialog.useProps()
  return (
    <SmartDialog elKey={dateDialog.key}>
      <StaticDatePicker
        {...extraProps}
        openTo="day"
        renderInput={params => <TextField {...params} />}
      />
    </SmartDialog>
  )
}
