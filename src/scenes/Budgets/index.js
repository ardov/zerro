import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Button } from 'antd'

import Header from 'containers/Header'
import { getAllBudgets } from 'store/data/selectors/budgetView'
import { getRootUser } from 'store/data/selectors/users'
import AccountList from 'containers/AccountList'
import { TagTable } from './TagTable'
import { TransferTable } from './TransferTable'
import BudgetInfo from './BudgetInfo'
import MonthSelector from './MonthSelect'
import isThisMonth from 'date-fns/is_this_month'

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

class Budgets extends React.Component {
  state = { selected: 0 }

  componentDidMount = () => {
    this.setCurrentMonth()
  }

  setCurrentMonth = () => {
    if (this.props.budgets) {
      const current = this.props.budgets.findIndex(budget =>
        isThisMonth(budget.date)
      )
      this.setState({ selected: current })
    }
  }
  setMonth = i => {
    this.setState({ selected: i })
  }
  render() {
    if (!this.props.budgets) return null

    const budgets = this.props.budgets
    const months = budgets.map(b => b.date)
    if (!budgets) return null
    const instrument = this.props.user.currency
    const index = this.state.selected
    console.log(this.props.budgets)

    return (
      <div>
        <Header />
        <Wrap>
          <LeftPanel>
            <MonthSelector
              months={months}
              current={index}
              onChange={this.setMonth}
            />
            <StyledBudgetInfo month={budgets[index]} instrument={instrument} />
            <StyledAccountList />
          </LeftPanel>
          <Grow1>
            <TagTable tags={budgets[index].tags} instrument={instrument} />
            <TransferTable
              transfers={budgets[index].transfers}
              instrument={instrument}
            />
          </Grow1>
        </Wrap>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  user: getRootUser(state),
  budgets: getAllBudgets(state),
})

export default connect(
  mapStateToProps,
  null
)(Budgets)
