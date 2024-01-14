import React from 'react'
import { useTranslation } from 'react-i18next'
import { List } from '@mui/material'
import { Debtor, Subheader } from './components'
import { addFxAmount, isZero } from '6-shared/helpers/money'
import { keys } from '6-shared/helpers/keys'
import { TFxCode } from '6-shared/types'
import { debtorModel } from '5-entities/debtors'

type TDebtorInfo = {
  name: string
  balance: number
  currency: TFxCode
}

export function DebtorList({ className = '' }) {
  const { t } = useTranslation('common')
  const debtors = debtorModel.useDebtors()
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
        <List dense>
          <Subheader name={t('iOwe')} amount={totalOwe} />
          {iOweList.map(d => (
            <Debtor
              key={d.name + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
            />
          ))}
        </List>
      )}

      {!!iLentList.length && (
        <List dense>
          <Subheader name={t('iAmOwed')} amount={totalLent} />
          {iLentList.map(d => (
            <Debtor
              key={d.name + d.currency}
              name={d.name}
              currency={d.currency}
              balance={d.balance}
            />
          ))}
        </List>
      )}
    </div>
  )
}
