import React, { FC } from 'react'
import { useAppSelector } from 'store'
import { selectCoreMonthTotals } from 'core-next/adapters/redux'
import { Typography } from '@mui/material'
import { TableRow } from '../shared/shared'

import { Metric } from '../models/useMetric'
import { TFxAmount, TISOMonth } from '6-shared/types'
import { DisplayAmount } from '5-entities/currency/displayCurrency'
import { useTranslation } from 'react-i18next'

type FooterProps = {
  month: TISOMonth
  metric: Metric
}

export const Footer: FC<FooterProps> = props => {
  const { month } = props
  const totals = useAppSelector(selectCoreMonthTotals)[month]
  const { t } = useTranslation('common')

  const Sum: FC<{ value: TFxAmount }> = ({ value }) => (
    <Typography
      variant="overline"
      align="right"
      noWrap
      sx={{
        color: 'text.secondary',
      }}
    >
      <DisplayAmount value={value} decimals="ifOnly" month={month} noCurrency />
    </Typography>
  )

  return (
    <TableRow
      name={
        <div>
          <Typography
            variant="overline"
            noWrap
            sx={{
              color: 'text.secondary',
            }}
          >
            {t('total')}
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
