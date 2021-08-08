import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import { getUserInstrument } from 'store/data/selectors'
import pluralize from 'helpers/pluralize'
import { Box, List, ListItem } from '@material-ui/core'
import { Account, Subheader } from './components'
import { PopulatedAccount } from 'types'
import { setInBudget } from 'store/localData/accounts/thunks'
import { Amount } from 'components/Amount'
import { Tooltip } from 'components/Tooltip'
import { useToggle } from 'helpers/useToggle'

export default function AccountList({ className = '' }) {
  const dispatch = useDispatch()
  const inBudget = useSelector(getInBudgetAccounts)
  const savings = useSelector(getSavingAccounts)
  const userInstrument = useSelector(getUserInstrument)

  const inBudgetActive = inBudget.filter(a => !a.archive)
  const inBudgetArchived = inBudget.filter(a => a.archive)
  const inBudgetArchivedSum = getTotal(inBudgetArchived)

  const savingsActive = savings.filter(a => !a.archive)
  const savingsArchived = savings.filter(a => a.archive)
  const savingsArchivedSum = getTotal(savingsArchived)

  const [showInBudgetArchived, toggleInBudgetArchived] = useToggle()
  const [showSavingsArchived, toggleSavingsArchived] = useToggle()

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
          amount={getTotal(inBudget)}
          currency={userInstrument?.shortTitle}
          onClick={toggleInBudgetArchived}
        />
        {inBudgetActive.map(acc => (
          <Account
            key={acc.id}
            account={acc}
            onDoubleClick={toggleInBalance(acc.id, false)}
          />
        ))}
        {!!inBudgetArchivedSum && !showInBudgetArchived && (
          <ListItem>
            <span>
              {`${inBudgetArchived.length} ${pluralize(
                inBudgetArchived.length,
                ['архивный счёт', 'архивных счёта', 'архивных счётов']
              )} на `}
              <Amount value={inBudgetArchivedSum} instrument="user" />
            </span>
          </ListItem>
        )}
        {showInBudgetArchived &&
          inBudgetArchived.map(acc => (
            <Account
              key={acc.id}
              account={acc}
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
          amount={getTotal(savings)}
          currency={userInstrument?.shortTitle}
          onClick={toggleSavingsArchived}
        />
        {savingsActive.map(acc => (
          <Account
            key={acc.id}
            account={acc}
            onDoubleClick={toggleInBalance(acc.id, true)}
          />
        ))}
        {!!savingsArchivedSum && !showSavingsArchived && (
          <ListItem>
            <Box
              component="span"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span>
                {`${savingsArchived.length} ${pluralize(
                  savingsArchived.length,
                  ['архивный счёт', 'архивных счёта', 'архивных счётов']
                )} на `}
              </span>
              <Amount value={savingsArchivedSum} instrument="user" />
            </Box>
          </ListItem>
        )}
        {showSavingsArchived &&
          savingsArchived.map(acc => (
            <Account
              key={acc.id}
              account={acc}
              onDoubleClick={toggleInBalance(acc.id, false)}
            />
          ))}
      </List>
    </div>
  )
}

function getTotal(accs: PopulatedAccount[]) {
  return accs.reduce((sum, a) => sum + a.convertedBalance, 0)
}
