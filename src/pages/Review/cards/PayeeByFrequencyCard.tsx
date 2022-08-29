import React from 'react'
import { Typography } from '@mui/material'
import { useAppSelector } from '@store'
import Rhythm from '@shared/ui/Rhythm'
import { getUserCurrencyCode } from '@models/instrument'
import pluralize from '@shared/helpers/pluralize'
import { Card } from './Card'
import { Stats } from '../selectors'
import { Amount } from '@shared/ui/Amount'

interface PayeeByFrequencyCardProps {
  byPayee: Stats['byPayee']
}

export function PayeeByFrequencyCard({ byPayee }: PayeeByFrequencyCardProps) {
  const currency = useAppSelector(getUserCurrencyCode)
  const sortedPayees = Object.keys(byPayee).sort(
    (a, b) =>
      byPayee[b].outcomeTransactions.length -
      byPayee[a].outcomeTransactions.length
  )
  const topPayee = sortedPayees[0]
  if (!topPayee) return null
  const transactions = byPayee[topPayee].outcomeTransactions.length
  const outcome = byPayee[topPayee].outcome

  if (!outcome) return null
  return (
    <Card>
      <Rhythm gap={1} alignItems="center">
        <Typography variant="body1" align="center">
          Любимое место
        </Typography>
        <Typography variant="h4" align="center" className="info-gradient">
          {topPayee}
        </Typography>
        <Typography variant="body1" align="center">
          {transactions}
          {' '}
          {pluralize(transactions, ['покупка', 'покупки', 'покупок'])} со
          средним чеком{' '}
          <Amount
            value={outcome / transactions}
            currency={currency}
            noShade
            decMode="ifOnly"
          />
          .
          <br />А всего потратили{' '}
          <Amount value={outcome} currency={currency} noShade decMode="ifAny" />
        </Typography>
      </Rhythm>
    </Card>
  )
}
