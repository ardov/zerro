import React, { useCallback, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getAccountList } from 'store/localData/accounts'
import { getUserInstrument } from 'store/data/selectors'
import pluralize from 'helpers/pluralize'
import { List, ListItem } from '@material-ui/core'
import { Account, Subheader } from './components'
import { PopulatedAccount } from 'types'
import { setInBudget } from 'store/localData/accounts/thunks'
import { Amount } from 'components/Amount'
import { Tooltip } from 'components/Tooltip'

export default function AccountList({ className = '' }) {
  const dispatch = useDispatch()
  const accounts = useSelector(getAccountList)
  const userInstrument = useSelector(getUserInstrument)

  const getTotalBalance = (accs: PopulatedAccount[]) =>
    accs.reduce((sum, a) => sum + a.convertedBalance, 0)

  const inBudget = accounts.filter(a => a.inBudget)
  const savings = accounts.filter(a => !a.inBudget && a.type !== 'debt')

  const inBudgetArchived = inBudget.filter(a => a.archive)
  const inBudgetActive = inBudget.filter(a => !a.archive)
  const inBudgetArchivedSum = getTotalBalance(inBudgetArchived)
  const inBudgetActiveSum = getTotalBalance(inBudgetActive)
  const savingsActive = savings.filter(a => !a.archive)

  const [showArchived, setShowArchived] = useState(!!inBudgetArchivedSum)
  const savingsSum = getTotalBalance(savings)

  const toggleInBalance = useCallback(
    (id: string, inBalance: boolean) => () =>
      dispatch(setInBudget(id, inBalance)),
    [dispatch]
  )

  // if (!userInstrumentId || !userInstrument) return null
  return (
    <div className={className}>
      <List dense>
        <Subheader
          name={
            <Tooltip title="Эти счета учитываются в бюджете">
              <span>В балансе</span>
            </Tooltip>
          }
          amount={inBudgetActiveSum + inBudgetArchivedSum}
          currency={userInstrument?.shortTitle}
          onClick={() => setShowArchived(a => !a)}
        />
        {inBudgetActive.map(acc => (
          <Account
            key={acc.id}
            account={acc}
            button
            onDoubleClick={toggleInBalance(acc.id, false)}
          />
        ))}
        {!!inBudgetArchivedSum && !showArchived && (
          <ListItem>
            {`${inBudgetArchived.length} ${pluralize(inBudgetArchived.length, [
              'архивный счёт',
              'архивных счёта',
              'архивных счётов',
            ])} на `}
            <Amount value={inBudgetArchivedSum} instrument="user" />
          </ListItem>
        )}
        {showArchived &&
          inBudgetArchived.map(acc => (
            <Account
              key={acc.id}
              account={acc}
              button
              onDoubleClick={toggleInBalance(acc.id, false)}
            />
          ))}
      </List>

      <List dense>
        <Subheader
          name={
            <Tooltip title="Эти счета не учитываются в бюджете, переводы на них отражаются как расходы. Сюда удобно выносить инвестиционные счета, ипотеку, кредиты и долгосрочные накопления.">
              <span>Прочее</span>
            </Tooltip>
          }
          amount={savingsSum}
          currency={userInstrument?.shortTitle}
        />
        {savingsActive.map(acc => (
          <Account
            key={acc.id}
            account={acc}
            button
            onDoubleClick={toggleInBalance(acc.id, true)}
          />
        ))}
      </List>
    </div>
  )
}
