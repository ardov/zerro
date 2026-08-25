import type { FC } from 'react'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { Typography } from '@mui/material'
import { TableRow } from '../shared/shared'

import type { Metric } from '../models/useMetric'
import type { TFxAmount, TISOMonth } from '6-shared/types'
import { DisplayAmount } from '3-widgets/DisplayAmount'
import { useTranslation } from 'react-i18next'

type FooterProps = {
  month: TISOMonth
  metric: Metric
}

const Sum: FC<{ value: TFxAmount; month: TISOMonth }> = ({ value, month }) => (
  <Typography
    variant="overline"
    align="right"
    noWrap
    className="text-muted-foreground"
  >
    <DisplayAmount value={value} decimals="ifOnly" month={month} noCurrency />
  </Typography>
)

export const Footer: FC<FooterProps> = props => {
  const { month } = props
  const totals = useAppSelector(core.months.selectTotals)[month]
  const { t } = useTranslation('common')

  return (
    <TableRow
      name={
        <div>
          <Typography
            variant="overline"
            noWrap
            className="text-muted-foreground"
          >
            {t('total')}
          </Typography>
        </div>
      }
      assigned={<Sum value={totals.assigned} month={month} />}
      outcome={<Sum value={totals.envActivity} month={month} />}
      available={<Sum value={totals.available} month={month} />}
      goal={null}
    />
  )
}
