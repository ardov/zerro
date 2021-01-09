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

  const inBudgetArchived = inBudget.filter(a => a.archive)
  const inBudgetActive = inBudget.filter(a => !a.archive)
  const inBudgetArchivedSum = getTotalBalance(inBudgetArchived)
  const inBudgetActiveSum = getTotalBalance(inBudgetActive)

  const savingsArchived = savings.filter(a => a.archive)
  const savingsActive = savings.filter(a => !a.archive)
  const savingsArchivedSum = getTotalBalance(savingsArchived)
  const savingsActiveSum = getTotalBalance(savingsActive)

  const savingsSum = getTotalBalance(savings)
  const [showArchived, setShowArchived] = useState(!!inBudgetArchivedSum)

  if (!userInstrumentId) return null
  return (
    <div className={className}>
      <List dense>
        <Subheader
          title="В бюджете"
          amount={inBudgetActiveSum + inBudgetArchivedSum}
          currency={userInstrument.shortTitle}
          onClick={() => setShowArchived(a => !a)}
        />
        {inBudgetActive.map(acc => (
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
        {!!inBudgetArchivedSum && !showArchived && (
          <Account
            title={`${
              inBudgetArchived.length
            } ${pluralize(inBudgetArchived.length, [
              'архивный счёт',
              'архивных счёта',
              'архивных счётов',
            ])}`}
            amount={inBudgetArchivedSum}
            currency={userInstrument.shortTitle}
          />
        )}
        {showArchived &&
          inBudgetArchived.map(acc => (
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
        {savingsActive.map(acc => (
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
