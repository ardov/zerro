import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Divider, useMediaQuery, Theme } from '@mui/material'
import { Period } from '../shared/period'
import { GroupBy } from '6-shared/helpers/date'
import { trModel } from '5-entities/transaction'
import { useAppSelector } from 'store'
import { differenceInMonths } from 'date-fns'
import { useNetWorth } from "../shared/netWorth"
import { StatSummary } from '../shared/cashflow'
import { DisplayAmount } from "5-entities/currency/displayCurrency";

type SavingsTooltipProps = {
  stats: StatSummary
  period: Period
  formatCurrency: (amount: number) => string,
  formatPercent: (amount: number) => string
}

export function SavingsTooltip({
  stats,
  period,
  formatCurrency,
  formatPercent
}: SavingsTooltipProps) {
  const { t } = useTranslation('analytics')
  const { monthsToLive, avgOutcome } = calculateMonthsToLiveAndAgvOutcome(
    stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance,
    period
  )

  const hasInBalanceOutcome = stats.totalOutcomeInBalance > 0
  const hasOutOfBalanceOutcome = stats.totalOutcomeOutOfBalance > 0
  const showOutcomeSection = hasInBalanceOutcome || hasOutOfBalanceOutcome
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  return (
    <Box p={1} minWidth={240}>
      {isMobile && (
        <>
          <Typography variant="body2">
            {t(stats.savingsRate >= 0 ? 'savingsRatePositive' : 'savingsRateNegative', {
              percent: formatPercent(stats.savingsRate)
            })}
          </Typography>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      <Typography variant="body2" gutterBottom>
        {t('income')}: <DisplayAmount value={stats.totalIncome} noShade decMode="ifOnly"/>
      </Typography>

      <Typography variant="body2" gutterBottom>
        {t('outcome')}: <DisplayAmount value={stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance} noShade decMode="ifOnly"/>
      </Typography>

      {showOutcomeSection && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {t('outcome')} {t('details')}:
          </Typography>

          {hasInBalanceOutcome && (
            <Typography variant="body2" gutterBottom>
              {t('fromFundsInBalance')}: <DisplayAmount value={stats.totalOutcomeInBalance} noShade decMode="ifOnly"/>
            </Typography>
          )}

          {hasOutOfBalanceOutcome && (
            <Typography variant="body2" gutterBottom>
              {t('fromFundsSaving')}: <DisplayAmount value={stats.totalOutcomeOutOfBalance} noShade decMode="ifOnly"/>
            </Typography>
          )}
        </>
      )}

      {monthsToLive > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            {t('monthsToLive', {count: monthsToLive, avgOutcome: formatCurrency(avgOutcome)})}
          </Typography>
        </>
      )}
    </Box>
  )
}

function calculateMonthsToLiveAndAgvOutcome(
  totalOutcome: number,
  period: Period): { monthsToLive: number; avgOutcome: number } {
  // with period = LastYear it return 13 points max, so we need to get only 12,
  // but if it returns only 11 or less we need to divide by 11
  const netWorthPoints = useNetWorth(period, GroupBy.Month)
  const lastMonth = netWorthPoints.length > 0 ? netWorthPoints[netWorthPoints.length - 1] : null

  if (!lastMonth)
    return { monthsToLive: 0,  avgOutcome: 0 }

  const currentBalance = lastMonth.lented +
    lastMonth.debts +
    lastMonth.accountDebts +
    lastMonth.fundsInBudget +
    lastMonth.fundsSaving

  const monthsInPeriod = useMonthsInPeriod(period)
  const months = monthsInPeriod >= netWorthPoints.length ? netWorthPoints.length : monthsInPeriod
  const avgOutcome = totalOutcome / months
  return {
    monthsToLive: avgOutcome === 0 ? 0 : Math.round(currentBalance / avgOutcome),
    avgOutcome: avgOutcome
  }
}

function useMonthsInPeriod(period: Period): number {
  const historyStart = useAppSelector(trModel.getHistoryStart)

  return useMemo(() => {
    switch (period) {
      case Period.ThreeYears:
        return 36
      case Period.All:
        const startDate = new Date(historyStart)
        const currentDate = new Date()
        const difference = differenceInMonths(currentDate, startDate)
        const monthsDiff = difference + 1
        return Math.max(1, monthsDiff)
      default:
        return 12
    }
  }, [period, historyStart])
}
