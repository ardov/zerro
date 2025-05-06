import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useAppTheme, useColorScheme } from '6-shared/ui/theme'
import { Period, PeriodTitle } from '../shared/period'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { useStatSummary } from '../WidgetStatCards/model'
import { Tooltip } from '6-shared/ui/Tooltip'
import { SavingsTooltip } from './SavingsTooltip'
import { getSavingsBackgroundColor } from "6-shared/ui/theme/colors";

type WidgetHeaderProps = {
  period: Period
  onTogglePeriod: () => void
}

const PERCENT_THRESHOLD = 0.05

function useFormatters(currency: string) {
  return useMemo(() => ({
    formatCurrency: (amount: number): string => formatMoney(amount, currency),
    formatPercent: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0.0' : value.toFixed(1)
  }), [currency])
}

export function WidgetHeader({ period, onTogglePeriod }: WidgetHeaderProps) {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()
  const { mode } = useColorScheme()
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)

  const savingsBgColor = getSavingsBackgroundColor(stats.totalSavings >= 0, mode)

  const savingsTextColor = stats.totalSavings >= 0
    ? theme.palette.success.main
    : theme.palette.error.main

  return (
    <Box p={2} minWidth="100%">
      <Typography variant="h5">
        {t('netWorth.title')}{' '}
        <span
          style={{ color: theme.palette.secondary.main, cursor: 'pointer' }}
          onClick={onTogglePeriod}
        >
          <PeriodTitle period={period} />
        </span>
        {' '}
        <Tooltip
          title={
            <SavingsTooltip
              stats={stats}
              period={period}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          }
          arrow
        >
          <Typography
            component="span"
            variant="h6"
            sx={{
              backgroundColor: savingsBgColor,
              padding: '2px 6px',
              borderRadius: '4px',
              ml: 0.5,
              color: savingsTextColor,
            }}
          >
            {stats.totalSavings > 0 ? '+' : ''}{formatCurrency(stats.totalSavings)}
          </Typography>
        </Tooltip>
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        {t(stats.savingsRate >= 0 ? 'savingsRatePositive' : 'savingsRateNegative', {
          percent: formatPercent(stats.savingsRate)
        })}
      </Typography>
    </Box>
  )
}
