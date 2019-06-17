import React from 'react'
import { connect } from 'react-redux'
import Account from './Account'
import { getInBalance, getOutOfBalance } from 'store/data/selectors/accounts'
import { getAllBudgets } from 'store/data/selectors/budgetView'

const getTotalBalance = accs =>
  accs.reduce((sum, acc) => +(sum + acc.balance).toFixed(2), 0)

const AccountList = props => (
  <div className={props.className}>
    <h3>В бюджете ({getTotalBalance(props.inBalance)})</h3>
    {props.inBalance.map(acc => (
      <Account key={acc.id} {...acc} />
    ))}
    <h3>Не в бюджете ({getTotalBalance(props.outOfBalance)})</h3>
    {props.outOfBalance.map(acc => (
      <Account key={acc.id} {...acc} />
    ))}
  </div>
)

const mapStateToProps = (state, props) => {
  console.log('ALL BUDGETS', getAllBudgets(state))
  return {
    inBalance: getInBalance(state),
    outOfBalance: getOutOfBalance(state)
  }
}

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountList)
