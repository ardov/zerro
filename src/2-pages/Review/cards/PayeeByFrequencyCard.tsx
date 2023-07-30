import React, { useState } from 'react'
import { ButtonBase, IconButton, Stack, Typography } from '@mui/material'
import pluralize from '6-shared/helpers/pluralize'

import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { entries } from '6-shared/helpers/keys'
import {
  DisplayAmount,
  displayCurrency,
} from '5-entities/currency/displayCurrency'
import { ArrowForwardIcon, ArrowBackIcon } from '6-shared/ui/Icons'

export function PayeeByFrequencyCard(props: TCardProps) {
  const [i, setI] = useState(0)
  const yearStats = useStats(props.year)
  const toDisplay = displayCurrency.useToDisplay('current')

  const topPayees = entries(yearStats.byPayee)
    .map(([payee, info]) => {
      return {
        payee,
        transactions: info.outcomeTransactions,
        outcome: toDisplay(info.outcome),
      }
    })
    .sort((a, b) => b.transactions.length - a.transactions.length)
    .filter(p => p.payee && p.payee !== 'null')
    .slice(0, 10)

  if (topPayees.length === 0) return null

  const next = () => setI(Math.min(i + 1, topPayees.length - 1))
  const prev = () => setI(Math.max(i - 1, 0))
  const { payee, transactions, outcome } = topPayees[i]
  const trLength = transactions.length

  if (!outcome) return null
  return (
    <Card>
      <Stack spacing={1} alignItems="center" direction="column">
        <Typography variant="body1" align="center">
          Любимое место #{i + 1}
        </Typography>

        <ButtonBase
          sx={{ borderRadius: 1, px: 1 }}
          onClick={() => props.onShowTransactions(transactions)}
        >
          <Stack spacing={1} alignItems="center" direction="column">
            <Typography variant="h4" align="center" className="info-gradient">
              {payee}
            </Typography>

            <Typography variant="body1" align="center">
              {trLength}
              {' '}
              {pluralize(trLength, ['покупка', 'покупки', 'покупок'])} со
              средним чеком{' '}
              <DisplayAmount
                value={outcome / trLength}
                noShade
                decMode="ifOnly"
              />
              .
              <br />А всего потратили{' '}
              <DisplayAmount value={outcome} noShade decMode="ifAny" />
            </Typography>
          </Stack>
        </ButtonBase>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ opacity: 0.3, transition: '200ms', '&:hover': { opacity: 1 } }}
        >
          <IconButton size="small" onClick={prev}>
            <ArrowBackIcon />
          </IconButton>

          <IconButton size="small" onClick={next}>
            <ArrowForwardIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  )
}
