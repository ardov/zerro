import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney, round } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { Tooltip } from '6-shared/ui/Tooltip'
import { accBalanceModel } from '5-entities/accBalances'
import { AccountType } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { accountModel } from '5-entities/account'
import { Period } from '../shared/period'
import { GroupBy } from '6-shared/helpers/date'
import { useStatSummary } from './model'
import { trModel } from '5-entities/transaction'
import { useAppSelector } from 'store'
import { differenceInMonths } from 'date-fns'

const DECIMAL_PRECISION = 10
const PERCENT_THRESHOLD = 0.05
const DEFAULT_MONTHS = 12
const THREE_YEARS_MONTHS = 36

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

export function WidgetStatCards({ period }: WidgetStatCardsProps) {
  const {t} = useTranslation('analytics')
  const theme = useAppTheme()
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)
  const monthsToLive = useMonthsToLive(stats.totalOutcome, period)

  const outcomeTooltip = useMemo(() =>
      monthsToLive > 0 ? (
        <Box p={1}>
          <Typography variant="body2">
            {t('monthsToLive', { count: monthsToLive })}
          </Typography>
        </Box>
      ) : null
    , [monthsToLive, t])

  return (
    <Box>
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
            tooltip={outcomeTooltip}
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
    </Box>
  )
}

function useFundsInBudget() {
  const accs = accountModel.usePopulatedAccounts()
  const balanceNodes = accBalanceModel.useDisplayBalances(GroupBy.Day)

  return useMemo(() => {
    const currentBalances = balanceNodes.length > 0
      ? balanceNodes[balanceNodes.length - 1].balances
      : { accounts: {}, debtors: {} }

    let fundsInBudget = 0
    keys(currentBalances.accounts).forEach(id => {
      if (accs[id]?.type === AccountType.Debt) return
      const value = currentBalances.accounts[id] || 0
      if (value > 0) {
        fundsInBudget = round(fundsInBudget + value)
      }
    })

    return fundsInBudget
  }, [balanceNodes, accs])
}

function useMonthsInPeriod(period: Period) {
  const historyStart = useAppSelector(trModel.getHistoryStart)

  return useMemo(() => {
    switch (period) {
      case Period.LastYear:
        return DEFAULT_MONTHS
      case Period.ThreeYears:
        return THREE_YEARS_MONTHS
      case Period.All:
        const startDate = new Date(historyStart)
        const currentDate = new Date()
        const monthsDiff = differenceInMonths(currentDate, startDate) + 1
        return Math.max(1, monthsDiff)
      default:
        return DEFAULT_MONTHS
    }
  }, [period, historyStart])
}

function useMonthsToLive(totalOutcome: number, period: Period) {
  const fundsInBudget = useFundsInBudget()
  const monthsInPeriod = useMonthsInPeriod(period)

  return useMemo(() => {
    const monthlyOutcome = totalOutcome / monthsInPeriod

    return monthlyOutcome > 0
      ? Math.round((fundsInBudget / monthlyOutcome) * DECIMAL_PRECISION) / DECIMAL_PRECISION
      : 0
  }, [fundsInBudget, totalOutcome, monthsInPeriod])
}

function useFormatters(currency: string) {
  return useMemo(() => ({
    formatCurrency: (amount: number): string => formatMoney(amount, currency),
    formatPercent: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0.0' : value.toFixed(1)
  }), [currency])
}

function StatCard({ title, value, color, suffix = '', tooltip }: StatCardProps) {
  const content = (
    <Paper sx={{ height: '100%' }}>
      <Box
        p={2}
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="center"
        height="100%"
      >
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

  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : content
}
