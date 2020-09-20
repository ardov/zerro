import React, { useEffect, useRef, useState } from 'react'
import { Dialog } from '@material-ui/core'
import { VariableSizeList as List } from 'react-window'
import { DatePicker } from '@material-ui/pickers'
import AutoSizer from 'react-virtualized-auto-sizer'
import { withStyles } from '@material-ui/core/styles'
import { Box, ListSubheader } from '@material-ui/core'
import Transaction from './Transaction'
import { formatDate } from 'helpers/format'

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const findDateIndex = (groups, date) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}

const StyledSubheader = withStyles(theme => ({
  root: { backgroundColor: theme.palette.background.paper },
  sticky: { top: 0 },
}))(ListSubheader)

export function GrouppedList({
  groups,
  opened,
  setOpened,
  checked,
  toggleTransaction,
  checkByChangedDate,
  onFilterByPayee,
}) {
  const listRef = useRef(null)
  const [clickedDate, setClickedDate] = useState(null)

  useEffect(() => {
    if (listRef.current) listRef.current.resetAfterIndex(0)
  }, [listRef, groups])

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
            itemData={groups}
          >
            {({ index, style }) => (
              <Box position="relative" maxWidth={560} mx="auto" style={style}>
                <StyledSubheader
                  onClick={() => setClickedDate(groups[index].date)}
                >
                  {formatDate(groups[index].date)}
                </StyledSubheader>
                {groups[index].transactions.map(id => (
                  <Transaction
                    key={id}
                    id={id}
                    isOpened={id === opened}
                    isChecked={checked.includes(id)}
                    isInSelectionMode={!!checked.length}
                    onToggle={() => toggleTransaction(id)}
                    onClick={() => setOpened && setOpened(id)}
                    onSelectChanged={checkByChangedDate}
                    onFilterByPayee={onFilterByPayee}
                  />
                ))}
              </Box>
            )}
          </List>
        )}
      </AutoSizer>
    </>
  )
}
