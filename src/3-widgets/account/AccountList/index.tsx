import type { FC } from 'react'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'
import { Collapse } from '@/6-shared/ui/Collapse'
import { ListRows, listItemDenseClass } from '@/6-shared/ui/ListRow'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { useToggle } from '@/6-shared/hooks/useToggle'
import type { TFxAmount } from '@/6-shared/types'
import { addFxAmount } from '@/6-shared/helpers/money'
import { toISOMonth } from '@/6-shared/helpers/date'

import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { Account, Subheader } from './components'

export default function AccountList({ className = '' }) {
  const { t } = useTranslation('accounts')
  const toDisplay = core.currency.useToDisplay(toISOMonth(new Date()))
  const inBudget = core.accounts
    .useInBudget()
    .sort(
      (a, b) =>
        toDisplay({ [b.fxCode]: b.balance }) -
        toDisplay({ [a.fxCode]: a.balance })
    )
  const savings = core.accounts
    .useSaving()
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
      <ListRows>
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
      </ListRows>

      <ListRows>
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
      </ListRows>
    </div>
  )
}

const ArchivedList: FC<{ accs: core.accounts.TAccountPopulated[] }> = props => {
  const { t } = useTranslation('accounts')
  const { accs } = props
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  const [visible, toggleVisibility] = useToggle()
  if (!accs.length) return null

  const sum = getTotal(accs)
  const hasArchivedMoney = Boolean(toDisplay(sum)) // It can be too small to show

  return (
    <>
      <Collapse open={visible}>
        <ListRows>
          {accs.map(acc => (
            <Account key={acc.id} account={acc} />
          ))}
        </ListRows>
      </Collapse>
      <button
        type="button"
        className={cn(listItemDenseClass, 'text-info')}
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
                decimals="ifOnly"
                noShade
              />
            )}
          </span>
        )}
      </button>
    </>
  )
}

function getTotal(accs: core.accounts.TAccountPopulated[]): TFxAmount {
  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}
