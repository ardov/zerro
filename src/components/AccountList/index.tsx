import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import {
  getInBudgetAccounts,
  getSavingAccounts,
} from 'store/localData/accounts'
import pluralize from 'helpers/pluralize'
import { Collapse, List, ListItemButton } from '@mui/material'
import { Account, Subheader } from './components'
import { PopulatedAccount } from 'types'
import { Amount } from 'components/Amount'
import { Tooltip } from 'components/Tooltip'
import { useToggle } from 'helpers/useToggle'

export default function AccountList({ className = '' }) {
  const inBudget = useSelector(getInBudgetAccounts)
  const savings = useSelector(getSavingAccounts)

  const inBudgetActive = inBudget.filter(a => !a.archive)
  const inBudgetArchived = inBudget.filter(a => a.archive)

  const savingsActive = savings.filter(a => !a.archive)
  const savingsArchived = savings.filter(a => a.archive)

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
        />
        {inBudgetActive.map(acc => (
          <Account key={acc.id} account={acc} />
        ))}
        <ArchivedList accs={inBudgetArchived} />
      </List>

      <List dense>
        <Subheader
          name={
            <Tooltip title="Эти счета не учитываются в бюджете, переводы на них отражаются как расходы. Сюда удобно выносить инвестиционные счета, ипотеку, кредиты и долгосрочные накопления.">
              <span>Прочее</span>
            </Tooltip>
          }
          amount={getTotal(savings)}
        />
        {savingsActive.map(acc => (
          <Account key={acc.id} account={acc} />
        ))}
        <ArchivedList accs={savingsArchived} />
      </List>
    </div>
  )
}

const ArchivedList: FC<{ accs: PopulatedAccount[] }> = props => {
  const { accs } = props
  const [visible, toggleVisibility] = useToggle()
  if (!accs.length) return null
  const sum = getTotal(accs)
  return (
    <>
      <Collapse in={visible}>
        <List dense>
          {accs.map(acc => (
            <Account key={acc.id} account={acc} />
          ))}
        </List>
      </Collapse>
      <ListItemButton
        sx={{ typography: 'body2', borderRadius: 1, color: 'info.main' }}
        onClick={toggleVisibility}
      >
        {visible ? (
          <span>Скрыть архивные</span>
        ) : (
          <span>
            {`+${accs.length} ${pluralize(accs.length, [
              'архивный счёт',
              'архивных счёта',
              'архивных счётов',
            ])} `}
            {!!sum && (
              <>
                (
                <Amount
                  value={sum}
                  instrument="user"
                  decMode="ifOnly"
                  noShade
                />
                )
              </>
            )}
          </span>
        )}
      </ListItemButton>
    </>
  )
}

function getTotal(accs: PopulatedAccount[]) {
  return accs.reduce((sum, a) => sum + a.convertedBalance, 0)
}
