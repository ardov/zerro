import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { Period } from '../shared/period'
import { useStatSummary } from './model'

type StatCardProps = {
  title: string
  value: string | number
  color?: string
  suffix?: string
}

type WidgetStatCardsProps = {
  period: Period
}

export function WidgetStatCards({period}: WidgetStatCardsProps) {
  const {t} = useTranslation('analytics')
  const theme = useAppTheme()
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()

  const formatCurrency = (amount: number) => formatMoney(amount, currency)
  const formatPercent = (value: number) => value.toFixed(1)

  return (
    <div>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('income')}
          value={formatCurrency(stats.totalIncome)}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('outcome')}
          value={formatCurrency(stats.totalOutcome)}
          color={theme.palette.error.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t(stats.totalSavings < 0 ? 'netOutcome' : 'netIncome')}
          value={formatCurrency(stats.totalSavings)}
          color={stats.totalSavings >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('savingsRate')}
          value={formatPercent(stats.savingsRate)}
          suffix="%"
          color={stats.savingsRate >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
      </Grid>
    </Grid>
    </div>
  )
}

function StatCard({title, value, color, suffix = ''}: StatCardProps) {
  return (
    <Paper sx={{height: '100%'}}>
      <Box p={2} display="flex" flexDirection="column" alignItems="flex-start"
           justifyContent="center" height="100%">
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
            color: color || 'inherit',
            wordBreak: 'break-word',
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{value}{suffix}</span>
        </Typography>
      </Box>
    </Paper>
  )
}
