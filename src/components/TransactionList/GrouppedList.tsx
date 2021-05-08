import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Dialog } from '@material-ui/core'
import { ListChildComponentProps, VariableSizeList as List } from 'react-window'
import { DatePicker } from '@material-ui/pickers'
import AutoSizer from 'react-virtualized-auto-sizer'
import { withStyles } from '@material-ui/core/styles'
import { Box, ListSubheader } from '@material-ui/core'
import Transaction from './Transaction'
import { formatDate } from 'helpers/format'

type GroupNode = {
  date: number
  transactions: string[]
}

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const findDateIndex = (groups: GroupNode[], date: GroupNode['date']) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}

const StyledSubheader = withStyles(theme => ({
  root: { backgroundColor: theme.palette.background.paper },
  sticky: { top: 0 },
}))(ListSubheader)

type GrouppedListProps = {
  groups: GroupNode[]
  checked: string[]
  toggleTransaction: (id: string) => void
  checkByChangedDate: (date: number) => void
  onFilterByPayee: (payee: string) => void
}
type DayData = GrouppedListProps & {
  onDateClick: (date: Date | number | null) => void
}

export const GrouppedList: FC<GrouppedListProps> = ({
  groups,
  checked,
  toggleTransaction,
  checkByChangedDate,
  onFilterByPayee,
}) => {
  const listRef = useRef<List>(null)
  const [clickedDate, setClickedDate] = useState<Date | number | null>(null)

  useEffect(() => {
    listRef?.current?.resetAfterIndex?.(0)
  }, [listRef, groups])

  const scrollToDate = useCallback(
    date =>
      listRef?.current?.scrollToItem(findDateIndex(groups, date), 'start'),
    [groups]
  )

  const minDate = groups.length ? groups[groups.length - 1].date : 0
  const maxDate = groups.length ? groups[0].date : 0
  const getItemKey = useCallback(i => +groups[i].date, [groups])
  const getItemSize = useCallback(
    i => HEADER_HEIGHT + TRANSACTION_HEIGHT * groups[i].transactions.length,
    [groups]
  )
  const itemData: DayData = {
    groups,
    checked,
    toggleTransaction,
    checkByChangedDate,
    onFilterByPayee,
    onDateClick: (date: Date | number | null) => setClickedDate(date),
  }

  return (
    <>
      <Dialog open={!!clickedDate} onClose={() => setClickedDate(null)}>
        <DatePicker
          autoOk
          maxDate={maxDate}
          minDate={minDate}
          variant="static"
          openTo="date"
          value={clickedDate}
          onChange={date => {
            setClickedDate(null)
            scrollToDate(date)
          }}
        />
      </Dialog>

      <AutoSizer disableWidth>
        {({ height }) => (
          <List
            className="hidden-scroll"
            ref={listRef}
            height={height}
            itemCount={groups.length}
            itemSize={getItemSize}
            width="100%"
            itemKey={getItemKey}
            itemData={itemData}
            useIsScrolling
          >
            {Day}
          </List>
        )}
      </AutoSizer>
    </>
  )
}

const Day: FC<ListChildComponentProps> = ({
  index,
  style,
  data,
  isScrolling,
}) => {
  const {
    groups,
    checked,
    toggleTransaction,
    checkByChangedDate,
    onFilterByPayee,
    onDateClick,
  } = data as DayData
  const [renderContent, setRenderContent] = useState(!isScrolling)
  useEffect(() => {
    if (!isScrolling) setRenderContent(true)
    let timer = setTimeout(() => setRenderContent(true), 300)
    return () => {
      clearTimeout(timer)
    }
  }, [isScrolling])
  const date = groups[index].date
  const length = groups[index].transactions.length

  if (!renderContent)
    return <DaySkeleton date={date} style={style} length={length} />
  else
    return (
      <Box position="relative" maxWidth={560} mx="auto" style={style}>
        <StyledSubheader onClick={() => onDateClick(date)}>
          {formatDate(date)}
        </StyledSubheader>

        {groups[index].transactions.map(id => (
          <Transaction
            key={id}
            id={id}
            // isOpened={id === opened}
            isChecked={checked.includes(id)}
            isInSelectionMode={!!checked.length}
            onToggle={toggleTransaction}
            onSelectChanged={checkByChangedDate}
            onFilterByPayee={onFilterByPayee}
          />
        ))}
      </Box>
    )
}

const DaySkeleton: FC<{
  date: number | Date
  length: number
  style: CSSProperties
}> = ({ date, style, length }) => (
  <Box position="relative" maxWidth={560} mx="auto" style={style}>
    <StyledSubheader>{formatDate(date)}</StyledSubheader>
    <div
      style={{
        height: length * TRANSACTION_HEIGHT,
        background:
          'radial-gradient(circle at 36px 36px, rgba(128,128,128,0.2) 20px,transparent 20px)',
        backgroundSize: '100% 72px',
      }}
    />
  </Box>
)
