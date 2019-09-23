import React from 'react'
import { connect } from 'react-redux'
import startOfMonth from 'date-fns/start_of_month'
import Header from 'components/Header'
import AccountList from 'components/AccountList'
import TagTable from './containers/TagTable'
import TransferTable from './containers/TransferTable'
import BudgetInfo from './containers/BudgetInfo'
import MonthSelector from './MonthSelect'
import getMonthDates from './selectors/getMonthDates'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import TagTable2 from './containers/TagTable2'
import Message from 'components/Message'

const Budgets = ({ monthDates }) => {
  const [month, setMonth] = React.useState(+startOfMonth(new Date()))

  const setCurrentMonth = () => setMonth(+startOfMonth(new Date()))
  const setMonthByIndex = i => setMonth(monthDates[i])
  const index = monthDates.findIndex(date => date === month)

  return (
    <Box pt={9} pb={3} px={3}>
      <Message />
      <Header />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MonthSelector
            months={monthDates}
            current={index}
            onSetCurrent={setCurrentMonth}
            onChange={setMonthByIndex}
          />
          <Box component={BudgetInfo} index={index} mt={3} />
          <Box component={AccountList} mt={3} />
        </Grid>
        <Grid item xs={12} md={9}>
          <TagTable2 index={index} date={monthDates[index]} />
          <TagTable index={index} date={monthDates[index]} />
          <Box component={TransferTable} index={index} mt={3} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default connect(
  state => ({ monthDates: getMonthDates(state) }),
  null
)(Budgets)
