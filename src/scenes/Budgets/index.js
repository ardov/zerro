import React from 'react'
import { connect } from 'react-redux'
import startOfMonth from 'date-fns/start_of_month'
import Header from 'components/Header'
import { getUserInstrument } from 'store/data/instruments'
import AccountList from 'components/AccountList'
import TagTable from './TagTable'
import { TransferTable } from './TransferTable'
import { getAmountsByTag } from './selectors/getAmountsByTag'
import { getTotalsByMonth } from './selectors/getTotalsByMonth'
import BudgetInfo from './BudgetInfo'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import { getTransfersOutsideBudget } from './selectors/getTransfersOutsideBudget'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'

const Budgets = ({ instrument, monthDates, totals, transfers, amounts }) => {
  const [month, setMonth] = React.useState(+startOfMonth(new Date()))

  const setCurrentMonth = () => setMonth(+startOfMonth(new Date()))
  const setMonthByIndex = i => setMonth(monthDates[i])
  const index = monthDates.findIndex(date => date === month)
  const currency = instrument ? instrument.shortTitle : 'RUB'

  return (
    <Box pt={9} pb={3} px={3}>
      <Header />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MonthSelector
            months={monthDates}
            current={index}
            onSetCurrent={setCurrentMonth}
            onChange={setMonthByIndex}
          />
          <Box
            component={BudgetInfo}
            month={totals[index]}
            currency={currency}
            mt={3}
          />
          <Box component={AccountList} mt={3} />
        </Grid>
        <Grid item xs={12} md={9}>
          <TagTable
            tags={amounts[index]}
            currency={currency}
            date={monthDates[index]}
          />
          <Box
            component={TransferTable}
            transfers={transfers[index]}
            currency={currency}
            mt={3}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

const mapStateToProps = (state, props) => {
  return {
    monthDates: getMonthDates(state),
    totals: getTotalsByMonth(state),
    transfers: getTransfersOutsideBudget(state),
    amounts: getAmountsByTag(state),
    instrument: getUserInstrument(state),
  }
}

export default connect(
  mapStateToProps,
  null
)(Budgets)
