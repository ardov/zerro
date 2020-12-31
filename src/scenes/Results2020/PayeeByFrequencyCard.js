import React from 'react'
import { Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import Rhythm from 'components/Rhythm'
import { Amount } from 'components/Amount'
import { getUserCurrencyCode } from 'store/serverData'
import pluralize from 'helpers/pluralize'
import { Card } from './Card'

export function PayeeByFrequencyCard({ byPayee }) {
  const currency = useSelector(getUserCurrencyCode)
  const sortedPayees = Object.keys(byPayee).sort(
    (a, b) =>
      byPayee[b].outcomeTransactions.length -
      byPayee[a].outcomeTransactions.length
  )
  const topPayee = sortedPayees[0]
  const transactions = byPayee[topPayee].outcomeTransactions.length
  const outcome = byPayee[topPayee].outcome

  return (
    <Card>
      <Rhythm gap={1}>
        <Typography variant="body1" align="center">
          Любимое место
        </Typography>
        <Typography variant="h4" align="center">
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
