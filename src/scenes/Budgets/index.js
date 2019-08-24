import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

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

const Wrap = styled.div`
  display: flex;
  flex-direction: row;
`
const Grow1 = styled.div`
  flex-grow: 1;
  padding: 0 12px;
`
const LeftPanel = styled.div`
  padding: 40px;
`
const StyledAccountList = styled(AccountList)`
  margin-top: 24px;
`
const StyledBudgetInfo = styled(BudgetInfo)`
  margin-top: 24px;
`
const StyledTagTable = styled(TagTable)`
  margin-top: 40px;
  margin-bottom: 24px;
`

class Budgets extends React.Component {
  state = { selected: +startOfMonth(new Date()) }

  componentDidMount = () => this.setCurrentMonth()

  setCurrentMonth = () => this.setState({ selected: +startOfMonth(new Date()) })

  setMonth = i => {
    const { monthDates } = this.props
    this.setState({ selected: monthDates[i] })
  }
  render() {
    const { instrument, monthDates, totals, transfers, amounts } = this.props
    const index = monthDates.findIndex(date => date === this.state.selected)
    const currency = instrument ? instrument.shortTitle : 'RUB'
    return (
      <div>
        <Header />
        <Wrap>
          <LeftPanel>
            <MonthSelector
              months={monthDates}
              current={index}
              onSetCurrent={this.setCurrentMonth}
              onChange={this.setMonth}
            />
            <StyledBudgetInfo month={totals[index]} currency={currency} />
            <StyledAccountList />
          </LeftPanel>
          <Grow1>
            <StyledTagTable
              tags={amounts[index]}
              currency={currency}
              date={monthDates[index]}
            />
            <TransferTable transfers={transfers[index]} currency={currency} />
          </Grow1>
        </Wrap>
      </div>
    )
  }
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
