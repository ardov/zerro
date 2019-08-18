import React from 'react'
import { connect } from 'react-redux'
import Account from './Account'
import styled from 'styled-components'
import { getAccountList } from 'store/data/accounts'
import { getUserInstrument } from 'store/data/users'

const Heading = styled(Account)`
  margin-top: 16px;
  font-weight: 700;
  font-size: 14px;
`

const getTotalBalance = (accs, targetInstrument) =>
  accs.reduce((sum, acc) => {
    const balance = acc.balance
    const accRate = acc.instrument.rate
    const targetRate = targetInstrument.rate
    return +(sum += (balance * accRate) / targetRate).toFixed(2)
  }, 0)

const AccountList = ({
  inBudget,
  savings,
  userInstrument,
  className,
  onAccountClick,
}) => {
  if (!userInstrument) return null

  const inBudgetSum = getTotalBalance(inBudget, userInstrument)
  const savingsSum = getTotalBalance(savings, userInstrument)

  return (
    <div className={className}>
      <Heading
        title="В бюджете"
        balance={inBudgetSum}
        instrument={userInstrument}
      />
      {inBudget.map(acc => (
        <Account key={acc.id} {...acc} onClick={() => onAccountClick(acc.id)} />
      ))}

      <Heading
        title="Сбережения"
        balance={savingsSum}
        instrument={userInstrument}
      />
      {savings.map(acc => (
        <Account key={acc.id} {...acc} />
      ))}
    </div>
  )
}

const mapStateToProps = (state, props) => ({
  inBudget: getAccountList(state).filter(
    a => !a.archive && !a.savings && a.type !== 'debt'
  ),
  savings: getAccountList(state).filter(
    a => !a.archive && a.savings && a.type !== 'debt'
  ),
  userInstrument: getUserInstrument(state),
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountList)
