import React from 'react'
import { connect } from 'react-redux'
import Account from './Account'
import styled from 'styled-components'
import { getAccountsInBudget, getSavingAccounts } from 'store/data/accounts'
import { getUserInstrument, getInstruments } from 'store/data/instruments'

const Heading = styled(Account)`
  margin-top: 16px;
  font-weight: 700;
  font-size: 14px;
`

const getTotalBalance = (accs, targetInstrument, instruments) =>
  accs.reduce((sum, acc) => {
    const balance = acc.balance
    const accRate = instruments[acc.instrument].rate
    const targetRate = targetInstrument.rate
    return +(sum += (balance * accRate) / targetRate).toFixed(2)
  }, 0)

const AccountList = ({
  inBudget,
  savings,
  userInstrument,
  instruments,
  className,
  onAccountClick,
}) => {
  if (!userInstrument) return null

  const inBudgetSum = getTotalBalance(inBudget, userInstrument, instruments)
  const savingsSum = getTotalBalance(savings, userInstrument, instruments)

  return (
    <div className={className}>
      <Heading
        title="В бюджете"
        balance={inBudgetSum}
        currency={userInstrument.shortTitle}
      />
      {inBudget.map(acc => (
        <Account
          key={acc.id}
          {...acc}
          currency={instruments[acc.instrument].shortTitle}
          onClick={() => onAccountClick(acc.id)}
        />
      ))}

      <Heading
        title="Сбережения"
        balance={savingsSum}
        currency={userInstrument.shortTitle}
      />
      {savings.map(acc => (
        <Account
          key={acc.id}
          {...acc}
          currency={instruments[acc.instrument].shortTitle}
        />
      ))}
    </div>
  )
}

const mapStateToProps = (state, props) => ({
  instruments: getInstruments(state),
  inBudget: getAccountsInBudget(state),
  savings: getSavingAccounts(state),
  userInstrument: getUserInstrument(state),
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountList)
