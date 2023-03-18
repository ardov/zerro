import React, { FC } from 'react'
import { Typography } from '@mui/material'
import { TableRow } from '../shared/shared'

import { Metric } from '../models/useMetric'
import { TFxAmount, TISOMonth } from '@shared/types'
import { balances } from '@entities/envBalances'
import { DisplayAmount } from '@entities/currency/displayCurrency'

type FooterProps = {
  month: TISOMonth
  metric: Metric
}

export const Footer: FC<FooterProps> = props => {
  const { month } = props
  const totals = balances.useTotals()[month]

  const Sum: FC<{ value: TFxAmount }> = ({ value }) => (
    <Typography variant="overline" color="text.secondary" align="right" noWrap>
      <DisplayAmount value={value} decMode="ifOnly" month={month} noCurrency />
    </Typography>
  )

  return (
    <TableRow
      name={
        <div>
          <Typography variant="overline" color="text.secondary" noWrap>
            Итого
          </Typography>
        </div>
      }
      budgeted={<Sum value={totals.budgeted} />}
      outcome={<Sum value={totals.envActivity} />}
      available={<Sum value={totals.available} />}
      goal={null}
    />
  )
}
