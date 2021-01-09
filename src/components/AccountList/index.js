import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import {
  getUserInstrument,
  getInstruments,
  convertCurrency,
  getUserInstrumentId,
} from 'store/serverData'
import pluralize from 'helpers/pluralize'
import { List } from '@material-ui/core'
import { Account, Subheader } from './components'
import { round } from 'helpers/currencyHelpers'
import { useState } from 'react'
import { setInBudget } from 'store/localData/accounts/thunks'

export default function AccountList({ className, onAccountClick }) {
  const dispatch = useDispatch()
  const convert = useSelector(convertCurrency)
  const instruments = useSelector(getInstruments)
  const userInstrument = useSelector(getUserInstrument)
  const userInstrumentId = useSelector(getUserInstrumentId)

  const getTotalBalance = accs =>
    accs.reduce((sum, acc) => {
      let balance = convert(acc.balance, acc.instrument, userInstrumentId)
      return round(sum + balance)
    }, 0)
  const compare = (a, b) => {
    const aBalance = convert(a.balance, a.instrument, userInstrumentId)
    const bBalance = convert(b.balance, b.instrument, userInstrumentId)
    return bBalance - aBalance
  }

  const inBudget = useSelector(getInBudgetAccounts).sort(compare)
  const savings = useSelector(getSavingAccounts).sort(compare)

  const archivedInBudget = inBudget.filter(a => a.archive)
  const activeInBudget = inBudget.filter(a => !a.archive)

  const archivedInBudgetSum = getTotalBalance(archivedInBudget)
  const activeInBudgetSum = getTotalBalance(activeInBudget)
  const savingsSum = getTotalBalance(savings)
  const [showArchived, setShowArchived] = useState(!!archivedInBudgetSum)

  if (!userInstrumentId) return null
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
            onDoubleClick={() => dispatch(setInBudget(acc.id, false))}
          />
        ))}
        {!!archivedInBudgetSum && !showArchived && (
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
        {showArchived &&
          archivedInBudget.map(acc => (
            <Account
              key={acc.id}
              button
              title={acc.title}
              amount={acc.balance}
              currency={instruments[acc.instrument].shortTitle}
              onClick={() => console.log(acc)}
              onDoubleClick={() => dispatch(setInBudget(acc.id, false))}
            />
          ))}
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
            onDoubleClick={() => dispatch(setInBudget(acc.id, true))}
          />
        ))}
      </List>
    </div>
  )
}
