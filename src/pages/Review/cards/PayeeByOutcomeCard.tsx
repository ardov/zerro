import React from 'react'
import { Typography } from '@mui/material'
import Rhythm from '@shared/ui/Rhythm'
import pluralize from '@shared/helpers/pluralize'
import { Amount } from '@shared/ui/Amount'

import { userModel } from '@entities/user'
import { Card } from './Card'
import { Stats } from '../selectors'

interface PayeeByOutcomeCardProps {
  byPayee: Stats['byPayee']
}

export function PayeeByOutcomeCard({ byPayee }: PayeeByOutcomeCardProps) {
  const currency = userModel.useUserCurrency()
  const sortedPayees = Object.keys(byPayee).sort(
    (a, b) => byPayee[b].outcome - byPayee[a].outcome
  )
  const topPayee = sortedPayees[0]
  if (!topPayee) return null
  const transactions = byPayee[topPayee].outcomeTransactions.length
  const outcome = byPayee[topPayee].outcome

  if (!outcome) return null
  return (
    <Card>
      <Rhythm gap={1} alignItems="center">
        <Typography variant="h4" align="center" className="red-gradient">
          {topPayee}
        </Typography>
        <Typography variant="body1" align="center">
          Здесь вы оставили{' '}
          <Amount
            value={outcome}
            currency={currency}
            noShade
            decMode="ifOnly"
          />{' '}
          ({transactions}
          {' '}
          {pluralize(transactions, ['покупка', 'покупки', 'покупок'])})
        </Typography>
      </Rhythm>
    </Card>
  )
}
