import React, { FC } from 'react'
import { Collapse, List, ListItemButton } from '@mui/material'
import pluralize from '@shared/helpers/pluralize'
import { Tooltip } from '@shared/ui/Tooltip'
import { useToggle } from '@shared/hooks/useToggle'
import { TFxAmount } from '@shared/types'
import { addFxAmount } from '@shared/helpers/money'
import { toISOMonth } from '@shared/helpers/date'

import { useAppSelector } from '@store'
import {
  getInBudgetAccounts,
  getSavingAccounts,
  TAccountPopulated,
} from '@entities/account'
import {
  DisplayAmount,
  displayCurrency,
} from '@entities/currency/displayCurrency'
import { Account, Subheader } from './components'

export default function AccountList({ className = '' }) {
  const toDisplay = displayCurrency.useToDisplay(toISOMonth(new Date()))
  const inBudget = useAppSelector(getInBudgetAccounts).sort(
    (a, b) =>
      toDisplay({ [b.fxCode]: b.balance }) -
      toDisplay({ [a.fxCode]: a.balance })
  )
  const savings = useAppSelector(getSavingAccounts).sort(
    (a, b) =>
      toDisplay({ [b.fxCode]: b.balance }) -
      toDisplay({ [a.fxCode]: a.balance })
  )

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

const ArchivedList: FC<{ accs: TAccountPopulated[] }> = props => {
  const { accs } = props
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const [visible, toggleVisibility] = useToggle()
  if (!accs.length) return null

  const sum = getTotal(accs)
  const hasArchivedMoney = Boolean(toDisplay(sum)) // It can be to small to show
  return (
    <>
      <Collapse in={visible} unmountOnExit>
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
            {hasArchivedMoney && (
              <DisplayAmount
                month={month}
                value={sum}
                decMode="ifOnly"
                noShade
              />
            )}
          </span>
        )}
      </ListItemButton>
    </>
  )
}

function getTotal(accs: TAccountPopulated[]): TFxAmount {
  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}
