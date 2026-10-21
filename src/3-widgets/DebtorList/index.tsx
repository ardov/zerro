import { BalanceSubheader } from '@/3-widgets/BalanceSubheader'
import { useTranslation } from 'react-i18next'
import type { ListRowSize } from '@/6-shared/ui/kit/ListRow'
import { Debtor } from './components'
import { addFxAmount, isZero } from '@/6-shared/helpers/money'
import { keys } from '@/6-shared/helpers/keys'
import type { TFxCode } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import { useAppSelector } from '@/store'
import { useTransactionDrawer } from '@/3-widgets/global/TransactionListDrawer'

type TDebtorInfo = {
  id: string
  name: string
  balance: number
  currency: TFxCode
}

export function DebtorList({
  className = '',
  size = 'sm',
}: {
  className?: string
  size?: ListRowSize
}) {
  const { t } = useTranslation('common')
  const debtors = useAppSelector(core.debtors.selectAll)
  const openTransactions = useTransactionDrawer()
  const list = Object.values(debtors)
    .filter(debtor => !isZero(debtor.balance))
    .reduce((acc, debtor) => {
      keys(debtor.balance).forEach(currency => {
        if (!debtor.balance[currency]) return
        acc.push({
          id: debtor.id,
          name: debtor.name,
          balance: debtor.balance[currency],
          currency,
        })
      })
      return acc
    }, [] as TDebtorInfo[])

  if (!list.length) return null

  const iOweList = list.filter(d => d.balance < 0)
  const iLentList = list.filter(d => d.balance > 0)
  const totalOwe = iOweList.reduce(
    (sum, d) => addFxAmount(sum, { [d.currency]: d.balance }),
    {}
  )
  const totalLent = iLentList.reduce(
    (sum, d) => addFxAmount(sum, { [d.currency]: d.balance }),
    {}
  )

  function openDebtorTransactions(d: TDebtorInfo) {
    openTransactions({
      title: `${d.name} · ${d.currency}`,
      initialQuery: {
        clauses: [
          { kind: 'debtor', ids: [d.id] },
          { kind: 'amount', currencies: [d.currency] },
        ],
      },
    })
  }

  return (
    <div className={className}>
      {!!iOweList.length && (
        <div className="relative flex flex-col py-2">
          <BalanceSubheader size={size} name={t('iOwe')} amount={totalOwe} />
          {iOweList.map(d => (
            <Debtor
              size={size}
              key={d.id + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
              onClick={() => openDebtorTransactions(d)}
            />
          ))}
        </div>
      )}

      {!!iLentList.length && (
        <div className="relative flex flex-col py-2">
          <BalanceSubheader
            size={size}
            name={t('iAmOwed')}
            amount={totalLent}
          />
          {iLentList.map(d => (
            <Debtor
              size={size}
              key={d.id + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
              onClick={() => openDebtorTransactions(d)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
