import React, { FC } from 'react'
import { Typography, Box } from '@mui/material'
import { rowStyle, useIsSmall } from '../shared/shared'

import { Metric } from '../models/useMetric'
import { TISOMonth } from '@shared/types'
import { balances } from '@entities/envBalances'
import { DisplayAmount } from '@entities/currency/displayCurrency'

type FooterProps = {
  month: TISOMonth
  metric: Metric
}

export const Footer: FC<FooterProps> = props => {
  const { month, metric } = props
  const isSmall = useIsSmall()
  const totals = balances.useTotals()[month]

  return (
    <Box sx={rowStyle}>
      <div>
        <Typography variant="overline" color="text.secondary" noWrap>
          Итого
        </Typography>
      </div>

      {(metric === Metric.budgeted || !isSmall) && (
        <Typography
          variant="overline"
          color="text.secondary"
          align="right"
          noWrap
        >
          <DisplayAmount
            value={totals.budgeted}
            decMode="ifOnly"
            month={month}
            noCurrency
          />
        </Typography>
      )}

      {(metric === Metric.outcome || !isSmall) && (
        <Typography
          variant="overline"
          color="text.secondary"
          align="right"
          noWrap
        >
          <DisplayAmount
            value={totals.envActivity}
            decMode="ifOnly"
            month={month}
            noCurrency
          />
        </Typography>
      )}

      {(metric === Metric.available || !isSmall) && (
        <Typography
          variant="overline"
          color="text.secondary"
          align="right"
          noWrap
        >
          <DisplayAmount
            value={totals.available}
            decMode="ifOnly"
            month={month}
            noCurrency
          />
        </Typography>
      )}
    </Box>
  )
}
