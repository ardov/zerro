import React, { FC } from 'react'
import { Typography, Box, useMediaQuery, Theme } from '@mui/material'
import { rowStyle } from '../shared/shared'

import { Metric } from '../models/useMetric'
import { TISOMonth } from '@shared/types'
import { balances } from '@entities/envBalances'
import { useToDisplay } from '@entities/displayCurrency'
import { Amount } from '@shared/ui/Amount'

type FooterProps = {
  month: TISOMonth
  metric: Metric
}

export const Footer: FC<FooterProps> = props => {
  const { month, metric } = props
  const isMd = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  const totals = balances.useTotals()[month]
  const toDisplay = useToDisplay(month)

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
          <Amount value={toDisplay(totals.budgeted)} decMode="ifOnly" />
        </Typography>
      )}

      {(metric === Metric.outcome || !isMd) && (
        <Typography
          variant="overline"
          color="text.secondary"
          align="right"
          noWrap
        >
          <Amount value={toDisplay(totals.envActivity)} decMode="ifOnly" />
        </Typography>
      )}

      {(metric === Metric.available || !isMd) && (
        <Typography
          variant="overline"
          color="text.secondary"
          align="right"
          noWrap
        >
          <Amount value={toDisplay(totals.available)} decMode="ifOnly" />
        </Typography>
      )}
    </Box>
  )
}
