import React, { FC } from 'react'
import { Typography, Box, useMediaQuery, Theme } from '@mui/material'
import { rowStyle } from '../shared/shared'

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
  const isMd = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const totals = balances.useTotals()[month]

  return (
    <Box sx={rowStyle}>
      <div>
        <Typography variant="overline" color="text.secondary" noWrap>
          Итого
        </Typography>
      </div>

      {(metric === Metric.budgeted || !isMd) && (
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

      {(metric === Metric.outcome || !isMd) && (
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

      {(metric === Metric.available || !isMd) && (
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
