import React from 'react'
import { connect } from 'react-redux'
import {
  getAccountsInBudget,
  getSavingAccounts,
} from 'store/localData/accounts'
import { getUserInstrument, getInstruments } from 'store/serverData'
import pluralize from 'helpers/pluralize'
import { List } from '@material-ui/core'
import { Account, Subheader } from './components'

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

  const archivedInBudget = inBudget.filter(a => a.archive)
  const activeInBudget = inBudget.filter(a => !a.archive)

  const archivedInBudgetSum = getTotalBalance(
    archivedInBudget,
    userInstrument,
    instruments
  )
  const activeInBudgetSum = getTotalBalance(
    activeInBudget,
    userInstrument,
    instruments
  )
  const savingsSum = getTotalBalance(savings, userInstrument, instruments)

  return (
    <div className={className}>
      <List dense>
        <Subheader
          title="В бюджете"
          amount={activeInBudgetSum + archivedInBudgetSum}
          currency={userInstrument.shortTitle}
        />
        {activeInBudget.map(acc => (
          <Account
            key={acc.id}
            button
            title={acc.title}
            amount={acc.balance}
            currency={instruments[acc.instrument].shortTitle}
          />
        ))}
        {!!archivedInBudgetSum && (
          <Account
            title={`${
              archivedInBudget.length
            } ${pluralize(archivedInBudget.length, [
              'архивный счёт',
              'архивных счёта',
              'архивных счётов',
            ])}`}
            amount={archivedInBudgetSum}
            currency={userInstrument.shortTitle}
          />
        )}
      </List>

      <List dense>
        <Subheader
          title="Прочее"
          amount={savingsSum}
          currency={userInstrument.shortTitle}
        />
        {savings.map(acc => (
          <Account
            key={acc.id}
            button
            title={acc.title}
            amount={acc.balance}
            currency={instruments[acc.instrument].shortTitle}
          />
        ))}
      </List>
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

export default connect(mapStateToProps, mapDispatchToProps)(AccountList)
