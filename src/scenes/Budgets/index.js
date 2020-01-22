import React from 'react'
import { connect } from 'react-redux'
import startOfMonth from 'date-fns/startOfMonth'
import AccountList from 'components/AccountList'
import TagTable from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import BudgetInfo from './containers/BudgetInfo'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import { Box, Hidden, useMediaQuery } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { DragDropContext } from 'react-beautiful-dnd'
import { moveFunds } from './thunks'
import MoveMoneyModal from './containers/MoveMoneyModal'

const Budgets = ({ monthDates, dispatch }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const [month, setMonth] = React.useState(+startOfMonth(new Date()))
  const [moneyModalProps, setMoneyModalProps] = React.useState({ open: false })

  const setCurrentMonth = () => setMonth(+startOfMonth(new Date()))
  const setMonthByIndex = i => setMonth(monthDates[i])
  const index = monthDates.findIndex(date => date === month)

  const moveMoney = e => {
    if (
      e.source &&
      e.destination &&
      e.source.droppableId !== e.destination.droppableId
    ) {
      const source = e.source.droppableId
      const destination = e.destination.droppableId

      setMoneyModalProps({
        open: true,
        source,
        destination,
        onMoneyMove: amount => {
          if (amount) dispatch(moveFunds(amount, source, destination, month))
          setMoneyModalProps({ open: false })
        },
      })
    }
  }

  return (
    <DragDropContext
      onDragEnd={moveMoney}
      onDragStart={() => {
        if (window.navigator.vibrate) {
          window.navigator.vibrate(100)
        }
      }}
    >
      <Box p={isMobile ? 1 : 3}>
        <MoveMoneyModal
          {...moneyModalProps}
          onClose={() => setMoneyModalProps({ open: false })}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <MonthSelector
              months={monthDates}
              current={index}
              onSetCurrent={setCurrentMonth}
              onChange={setMonthByIndex}
            />
            <Box component={BudgetInfo} index={index} mt={3} />
            <Hidden smDown>
              <Box component={AccountList} mt={3} />
            </Hidden>
          </Grid>
          <Grid item xs={12} md={9}>
            <TagTable index={index} date={monthDates[index]} />
            <Box component={TransferTable} index={index} mt={3} />
          </Grid>
        </Grid>
      </Box>
    </DragDropContext>
  )
}

export default connect(
  state => ({ monthDates: getMonthDates(state) }),
  null
)(Budgets)
