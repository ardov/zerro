import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListItemButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useToggle } from '6-shared/hooks/useToggle'
import { TFxAmount } from '6-shared/types'
import { addFxAmount } from '6-shared/helpers/money'
import { toISOMonth } from '6-shared/helpers/date'

import { accountModel, TAccountPopulated } from '5-entities/account'
import {
  DisplayAmount,
  displayCurrency,
} from '5-entities/currency/displayCurrency'
import { Account, Subheader } from './components'

export default function AccountList({ className = '' }) {
  const { t } = useTranslation('accounts')
  const toDisplay = displayCurrency.useToDisplay(toISOMonth(new Date()))
  const inBudget = accountModel
    .useInBudgetAccounts()
    .sort(
      (a, b) =>
        toDisplay({ [b.fxCode]: b.balance }) -
        toDisplay({ [a.fxCode]: a.balance })
    )
  const savings = accountModel
    .useSavingAccounts()
    .sort(
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
            <Tooltip title={t('inBalanceDescription')}>
              <span>{t('inBalance')}</span>
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
            <Tooltip title={t('otherDescription')}>
              <span>{t('other')}</span>
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
  const { t } = useTranslation('accounts')
  const { accs } = props
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const [visible, toggleVisibility] = useToggle()
  if (!accs.length) return null

  const sum = getTotal(accs)
  const hasArchivedMoney = Boolean(toDisplay(sum)) // It can be too small to show

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
          <span>{t('hideArchived')}</span>
        ) : (
          <span>
            {t('archivedAccounts', { count: accs.length })}{' '}
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
