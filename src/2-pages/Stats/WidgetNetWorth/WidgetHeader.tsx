import React, { useMemo } from 'react'
import { Box, Theme, Typography, useMediaQuery } from '@mui/material'
import { useAppTheme, useColorScheme } from '6-shared/ui/theme'
import { red, green } from '@mui/material/colors'
import { Period, PeriodTitle } from '../shared/period'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '6-shared/helpers/money'
import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import { useStatSummary } from '../shared/cashflow'
import { Tooltip } from '6-shared/ui/Tooltip'
import { SavingsTooltip } from './SavingsTooltip'

const percentThreshold = 0.05

type WidgetHeaderProps = {
  period: Period
  onTogglePeriod: () => void
}

const customColors = {
    positive: { light: green[100], dark: green[900] },
    negative: { light: red[100], dark: '#673131' },
}

export function WidgetHeader({ period, onTogglePeriod }: WidgetHeaderProps) {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()
  const { mode } = useColorScheme()
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const savingsBgColor = customColors[stats.totalSavings >= 0 ? 'positive' : 'negative'][mode]
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
          placement={isMobile ? "bottom" : "right"}
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
            {stats.totalSavings > 0 ? '+' : ''}
            <DisplayAmount value={stats.totalSavings} noShade decMode="ifOnly" />
          </Typography>
        </Tooltip>
      </Typography>

      {!isMobile && <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        {t(stats.savingsRate >= 0 ? 'savingsRatePositive' : 'savingsRateNegative', {
          percent: formatPercent(stats.savingsRate)
        })}
      </Typography>}
    </Box>
  )
}

function useFormatters(currency: string) {
  return useMemo(() => ({
    formatCurrency: (amount: number): string => formatMoney(amount, currency),
    formatPercent: (value: number): string => {
      if (Math.abs(value) < percentThreshold) return '0.0'
      return value.toFixed(Math.abs(value) < 1 ? 2 : 1)
    }
  }), [currency])
}
