import { useTranslation } from 'react-i18next'
import { ListRows } from '@/6-shared/ui/ListRow'
import { Debtor, Subheader } from './components'
import { addFxAmount, isZero } from '@/6-shared/helpers/money'
import { keys } from '@/6-shared/helpers/keys'
import type { TFxCode } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import { useAppSelector } from '@/store'

type TDebtorInfo = {
  name: string
  balance: number
  currency: TFxCode
}

export function DebtorList({ className = '' }) {
  const { t } = useTranslation('common')
  const debtors = useAppSelector(core.debtors.selectAll)
  const list = Object.values(debtors)
    .filter(debtor => !isZero(debtor.balance))
    .reduce((acc, debtor) => {
      keys(debtor.balance).forEach(currency => {
        if (!debtor.balance[currency]) return
        acc.push({
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

  return (
    <div className={className}>
      {!!iOweList.length && (
        <ListRows>
          <Subheader name={t('iOwe')} amount={totalOwe} />
          {iOweList.map(d => (
            <Debtor
              key={d.name + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
            />
          ))}
        </ListRows>
      )}

      {!!iLentList.length && (
        <ListRows>
          <Subheader name={t('iAmOwed')} amount={totalLent} />
          {iLentList.map(d => (
            <Debtor
              key={d.name + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
            />
          ))}
        </ListRows>
      )}
    </div>
  )
}
