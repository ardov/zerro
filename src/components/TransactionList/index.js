import React, { memo, forwardRef } from 'react'
import styled from 'styled-components'
import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { VariableSizeList as List } from 'react-window'
import { areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import { connect } from 'react-redux'
import TransactionGroup from './TransactionGroup'
import Search from './Search'
import { getTransactionList } from 'store/data/transactions'

function formatDate(date) {
  const formats = {
    today: 'Сегодня, D MMMM, dd',
    yesterday: 'Вчера, D MMMM, dd',
    thisYear: 'D MMMM, dd',
    previousYear: 'D MMMM YYYY, dd',
  }
  const formatString = isToday(date)
    ? formats.today
    : isYesterday(date)
    ? formats.yesterday
    : isThisYear(date)
    ? formats.thisYear
    : formats.previousYear

  return format(date, formatString, { locale: ru })
}

const Wrapper = styled.div`
  position: relative;
`

class TransactionList extends React.Component {
  state = { listRef: {} }

  componentDidUpdate = (_, prevState) => {
    if (prevState.listRef.resetAfterIndex) prevState.listRef.resetAfterIndex(0)
  }

  setRef = r => this.setState({ listRef: r })

  getItemKey = i =>
    +this.props.groupped[i].date +
    '-' +
    this.props.groupped[i].transactions.length

  getItemSize = (i, d) => {
    const GROUP_HEADER_HEIGHT = 48
    const TRANSACTION_HEIGHT = 77
    const BORDER_HEIGHT = 2
    return (
      GROUP_HEADER_HEIGHT +
      TRANSACTION_HEIGHT * this.props.groupped[i].transactions.length +
      BORDER_HEIGHT
    )
  }

  render() {
    const { groupped, className } = this.props
    const SEARCH_HEIGHT = 56
    const PADDING_BOTTOM = 40

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

    const Row = memo(
      ({ index, style }) => (
        <TransactionGroup
          style={{ ...style, top: style.top + SEARCH_HEIGHT }}
          topOffset={SEARCH_HEIGHT}
          key={+groupped[index].date}
          name={formatDate(groupped[index].date)}
          transactions={groupped[index].transactions}
        />
      ),
      areEqual
    )

    return (
      <Wrapper className={className}>
        <Search />
        <AutoSizer disableWidth={true}>
          {({ height, width }) => (
            <List
              className="hidden-scroll"
              ref={this.setRef}
              innerElementType={innerElementType}
              height={height}
              itemCount={groupped.length}
              itemSize={this.getItemSize}
              width={'100%'}
              itemKey={this.getItemKey}
              itemData={groupped}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </Wrapper>
    )
  }
}

export default connect(
  (state, params) => ({ groupped: getTransactionList(state, params) }),
  null
)(TransactionList)
