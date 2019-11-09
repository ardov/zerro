import React, { forwardRef, useEffect, useRef } from 'react'
import { Box } from '@material-ui/core'
import { VariableSizeList as List } from 'react-window'
// import { areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import { connect } from 'react-redux'
import TransactionGroup from './TransactionGroup'
import TopBar from './TopBar'
import { getMainTransactionList } from 'store/data/transactions'
import formatDate from './formatDate'

const GROUP_HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72
const PADDINGS = 16

const SEARCH_HEIGHT = 72
const PADDING_BOTTOM = 40

function TransactionList({ groups, className, opened, setOpened }) {
  const listRef = useRef()

  useEffect(() => {
    if (listRef.current) listRef.current.resetAfterIndex(0)
  }, [listRef, groups])

  const getItemKey = i => +groups[i].date

  const getItemSize = (i, d) =>
    GROUP_HEADER_HEIGHT +
    TRANSACTION_HEIGHT * groups[i].transactions.length +
    PADDINGS +
    16

  const innerElementType = forwardRef(({ children, style, ...rest }, ref) => (
    <div
      ref={ref}
      style={{
        ...style,
        height: style.height + SEARCH_HEIGHT + PADDING_BOTTOM,
        scrollbarWidth: 0,
      }}
      {...rest}
    >
      {children}
    </div>
  ))

  const Row = ({ index, style }) => (
    <TransactionGroup
      style={{ ...style, top: style.top + SEARCH_HEIGHT + 16 }}
      topOffset={SEARCH_HEIGHT}
      name={formatDate(groups[index].date)}
      transactions={groups[index].transactions}
      {...{ opened, setOpened }}
    />
  )

  return (
    <Box position="relative" className={className}>
      <TopBar />
      <AutoSizer disableWidth>
        {({ height }) => (
          <List
            className="hidden-scroll"
            ref={listRef}
            innerElementType={innerElementType}
            height={height}
            itemCount={groups.length}
            itemSize={getItemSize}
            width="100%"
            itemKey={getItemKey}
            itemData={groups}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </Box>
  )
}

export default connect(
  state => ({ groups: getMainTransactionList(state) }),
  null
)(TransactionList)
