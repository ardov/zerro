import React from 'react'
import { connect, useSelector } from 'react-redux'
import {
  getAccountsInBudget,
  getSavingAccounts,
} from 'store/localData/accounts'
import { getUserInstrument, getInstruments } from 'store/serverData'
import pluralize from 'helpers/pluralize'
import { List } from '@material-ui/core'
import { Account, Subheader } from './components'
import { round } from 'helpers/currencyHelpers'
import { useState } from 'react'

const getTotalBalance = (accs, targetInstrument, instruments) =>
  accs.reduce((sum, acc) => {
    const balance = acc.balance
    const accRate = instruments[acc.instrument].rate
    const targetRate = targetInstrument.rate
    return round((sum += (balance * accRate) / targetRate))
  }, 0)

export default function AccountList({ className, onAccountClick }) {
  const instruments = useSelector(getInstruments)
  const inBudget = useSelector(getAccountsInBudget)
  const savings = useSelector(getSavingAccounts)
  const userInstrument = useSelector(getUserInstrument)

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
  const [showArchived, setShowArchived] = useState(!!archivedInBudgetSum)

  if (!userInstrument) return null
  return (
    <div className={className}>
      <List dense>
        <Subheader
          title="В бюджете"
          amount={activeInBudgetSum + archivedInBudgetSum}
          currency={userInstrument.shortTitle}
          onClick={() => setShowArchived(a => !a)}
        />
        {activeInBudget.map(acc => (
          <Account
            key={acc.id}
            button
            title={acc.title}
            amount={acc.balance}
            currency={instruments[acc.instrument].shortTitle}
            onClick={() => console.log(acc)}
          />
        ))}
        {showArchived && (
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
