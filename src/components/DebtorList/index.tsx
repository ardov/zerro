import React from 'react'
import { useAppSelector } from '@store'
import { List } from '@mui/material'
import { Debtor, Subheader } from './components'
import { getDebtors } from '@entities/debtors'
import { addFxAmount, isZero } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import { TFxCode } from '@shared/types'

type TDebtorInfo = {
  name: string
  balance: number
  currency: TFxCode
}

export function DebtorList({ className = '' }) {
  const debtors = useAppSelector(getDebtors)
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
          <Subheader name="Я должен" amount={totalOwe} />
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
          <Subheader name="Мне должны" amount={totalLent} />
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
