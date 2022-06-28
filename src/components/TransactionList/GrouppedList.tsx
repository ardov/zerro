import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Dialog, Typography } from '@mui/material'
import { ListChildComponentProps, VariableSizeList as List } from 'react-window'
import StaticDatePicker from '@mui/lab/StaticDatePicker'
import TextField from '@mui/material/TextField'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Box, ListSubheader } from '@mui/material'
import Transaction from './Transaction'
import { formatDate, parseDate } from 'shared/helpers/date'
import { TDateDraft, TISODate } from 'shared/types'
import { toISODate } from 'shared/helpers/date'
import { TTransactionId } from 'models/transaction'

type GroupNode = {
  date: TISODate
  transactions: TTransactionId[]
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
  checked: string[]
  toggleTransaction: (id: string) => void
  checkByChangedDate: (date: number) => void
  onFilterByPayee: (payee: string) => void
}
type DayData = GrouppedListProps & {
  onDateClick: (date: TDateDraft | null) => void
}

export const GrouppedList: FC<GrouppedListProps> = ({
  groups,
  checked,
  toggleTransaction,
  checkByChangedDate,
  onFilterByPayee,
}) => {
  const listRef = useRef<List>(null)
  const [clickedDate, setClickedDate] = useState<TISODate | null>(null)

  useEffect(() => {
    listRef?.current?.resetAfterIndex?.(0)
  }, [listRef, groups])

  const scrollToDate = useCallback(
    (date: TDateDraft) =>
      listRef?.current?.scrollToItem(
        findDateIndex(groups, toISODate(date)),
        'start'
      ),
    [groups]
  )

  const minDate = groups.length ? groups[groups.length - 1].date : 0
  const maxDate = groups.length ? groups[0].date : 0
  const getItemKey = useCallback((i: number) => groups[i].date, [groups])
  const getItemSize = useCallback(
    (i: number) =>
      HEADER_HEIGHT + TRANSACTION_HEIGHT * groups[i].transactions.length,
    [groups]
  )
  const itemData: DayData = {
    groups,
    checked,
    toggleTransaction,
    checkByChangedDate,
    onFilterByPayee,
    onDateClick: (date: TDateDraft | null) => {
      setClickedDate(date ? toISODate(date) : null)
    },
  }

  return (
    <>
      <Dialog open={!!clickedDate} onClose={() => setClickedDate(null)}>
        <StaticDatePicker
          value={clickedDate && parseDate(clickedDate)}
          maxDate={parseDate(maxDate)}
          minDate={parseDate(minDate)}
          openTo="day"
          onChange={date => {
            setClickedDate(null)
            if (date) scrollToDate(date)
          }}
          renderInput={params => <TextField {...params} />}
        />
      </Dialog>

      <AutoSizer disableWidth>
        {({ height }) =>
          groups.length ? (
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
          ) : (
            <Box p={5}>
              <Typography variant="body1" align="center" paragraph>
                Таких операций нет.
                <br />
                Возможно, дело в фильтрах.
              </Typography>
            </Box>
          )
        }
      </AutoSizer>
    </>
  )
}

const Day: FC<ListChildComponentProps<DayData>> = ({
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
  } = data
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
        <ListSubheader onClick={() => onDateClick(date)}>
          {formatDate(date)}
        </ListSubheader>

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
  date: TDateDraft
  length: number
  style: CSSProperties
}> = ({ date, style, length }) => (
  <Box position="relative" maxWidth={560} mx="auto" style={style}>
    <ListSubheader>{formatDate(date)}</ListSubheader>
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
