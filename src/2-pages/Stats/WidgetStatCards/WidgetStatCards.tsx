import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { Tooltip } from '6-shared/ui/Tooltip'
import { Period } from '../shared/period'
import { useStatSummary } from './model'
import { OutcomeTooltip } from './OutcomeTooltip'

const PERCENT_THRESHOLD = 0.05

type StatCardProps = {
  title: string
  value: string | number
  color?: string
  suffix?: string
  tooltip?: React.ReactNode
}

type WidgetStatCardsProps = {
  period: Period
}

type Formatters = {
  formatCurrency: (amount: number) => string
  formatPercent: (value: number) => string
}

const styles = {
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
    p: 2
  },
  value: {
    wordBreak: 'break-word' as const,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
  },
  valueWrapper: {
    whiteSpace: 'nowrap' as const
  }
}

export const WidgetStatCards = React.memo(function WidgetStatCards({ period }: WidgetStatCardsProps) {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()
  const { palette } = theme
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('income')}
            value={formatCurrency(stats.totalIncome)}
            color={palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('outcome')}
            value={formatCurrency(stats.totalOutcome)}
            color={palette.error.main}
            tooltip={
              <OutcomeTooltip 
                totalOutcome={stats.totalOutcome} 
                period={period} 
                formatCurrency={formatCurrency}
              />
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t(stats.totalSavings < 0 ? 'netOutcome' : 'netIncome')}
            value={formatCurrency(stats.totalSavings)}
            color={stats.totalSavings >= 0 ? palette.success.main : palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('savingsRate')}
            value={formatPercent(stats.savingsRate)}
            suffix="%"
            color={stats.savingsRate >= 0 ? palette.success.main : palette.error.main}
          />
        </Grid>
      </Grid>
    </Box>
  )
})

function useFormatters(currency: string): Formatters {
  return useMemo(() => ({
    formatCurrency: (amount: number): string => formatMoney(amount, currency),
    formatPercent: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0.0' : value.toFixed(1)
  }), [currency])
}

const StatCard = React.memo(function StatCard({ title, value, color, suffix = '', tooltip }: StatCardProps) {
  const content = (
    <Paper sx={{ height: '100%' }}>
      <Box sx={styles.cardContent}>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          component="div"
          sx={{
            ...styles.value,
            color: color || 'inherit'
          }}
        >
          <span style={styles.valueWrapper}>{value}{suffix}</span>
        </Typography>
      </Box>
    </Paper>
  )

  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : content
})
