import React, { useEffect, useRef, useMemo, useState } from 'react'
import { Box, Dialog } from '@material-ui/core'
import { VariableSizeList as List } from 'react-window'
import { DatePicker } from '@material-ui/pickers'
// import { areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import { connect } from 'react-redux'
import TransactionGroup from './TransactionGroup'
import TopBar from './TopBar'
import { getSortedTransactions } from 'store/localData/transactions'
import { checkRaw, getFilterConditions } from 'store/filterConditions'
import { groupTransactionsBy } from 'store/localData/transactions/helpers'

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

export function TransactionList({
  transactions,
  filterConditions,
  opened,
  setOpened,
  ...rest
}) {
  const listRef = useRef(null)
  const [clickedDate, setShowClickedDate] = useState(null)

  useEffect(() => {
    if (listRef.current) listRef.current.resetAfterIndex(0)
  }, [listRef, transactions, filterConditions])

  const groups = useMemo(() => {
    const groupped = groupTransactionsBy(
      'DAY',
      transactions.filter(checkRaw(filterConditions))
    )
    return groupped.map(group => ({
      ...group,
      transactions: group.transactions.map(tr => tr.id),
    }))
  }, [transactions, filterConditions])

  const scrollToDate = date => {
    if (listRef.current)
      listRef.current.scrollToItem(findDateIndex(groups, date), 'start')
  }

  const minDate = groups.length ? groups[groups.length - 1].date : 0
  const maxDate = groups.length ? groups[0].date : 0

  const getItemKey = i => +groups[i].date

  const getItemSize = i =>
    HEADER_HEIGHT + TRANSACTION_HEIGHT * groups[i].transactions.length

  return (
    <Box display="flex" flexDirection="column" {...rest}>
      <TopBar />

      <Dialog open={!!clickedDate} onClose={() => setShowClickedDate(null)}>
        <DatePicker
          autoOk
          maxDate={maxDate}
          minDate={minDate}
          variant="static"
          openTo="date"
          value={clickedDate}
          onChange={date => {
            setShowClickedDate(null)
            scrollToDate(date)
          }}
        />
      </Dialog>

      <Box flex="1 1 auto">
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
              itemData={groups}
            >
              {({ index, style }) => (
                <TransactionGroup
                  style={style}
                  date={groups[index].date}
                  transactions={groups[index].transactions}
                  onSelectDate={date => setShowClickedDate(date)}
                  {...{ opened, setOpened }}
                />
              )}
            </List>
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

export default connect(
  state => ({
    transactions: getSortedTransactions(state),
    filterConditions: getFilterConditions(state),
  }),
  () => ({})
)(TransactionList)

const findDateIndex = (groups, date) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}
