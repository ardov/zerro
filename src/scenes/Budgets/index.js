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
import { Budget } from './Budget'

const Wrap = styled.div`
  display: flex;
  flex-direction: row;
`
const Grow1 = styled.div`
  flex-grow: 1;
  padding: 0 12px;
`
const StyledAccountList = styled(AccountList)`
  padding: 40px;
`

class Budgets extends React.Component {
  state = { selected: 0 }
  nextMonth = () => {
    this.setState(prev => ({ selected: ++prev.selected }))
  }
  prevMonth = () => {
    this.setState(prev => ({ selected: --prev.selected }))
  }
  lastMonth = () => {
    this.setState({ selected: this.props.budgets.length - 1 })
  }
  render() {
    const budgets = this.props.budgets
    if (!budgets) return null
    const instrument = this.props.user.currency
    const index = this.state.selected
    console.log(this.props.budgets)

    return (
      <div>
        <Header />
        <Wrap>
          <StyledAccountList />
          <div>
            <Button onClick={this.prevMonth} disabled={!index}>
              Предыдущий
            </Button>
            <Button
              onClick={this.nextMonth}
              disabled={index >= budgets.length - 1}
            >
              Следующий
            </Button>
            <Button onClick={this.lastMonth}>Последний</Button>
            {budgets && (
              <Budget month={budgets[index]} instrument={instrument} />
            )}
          </div>
          <Grow1>
            <TagTable tags={budgets[index].tags} instrument={instrument} />
          </Grow1>
          <Grow1>
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
