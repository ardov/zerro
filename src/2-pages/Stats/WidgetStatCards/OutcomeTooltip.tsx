import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Box, Typography} from '@mui/material'
import {Period} from '../shared/period'
import {GroupBy} from '6-shared/helpers/date'
import {trModel} from '5-entities/transaction'
import {useAppSelector} from 'store'
import {differenceInMonths} from 'date-fns'
import {useNetWorth} from "../shared/netWorth";

const CONSTANTS = {
  DECIMAL_PRECISION: 1,
  DEFAULT_MONTHS: 12,
  THREE_YEARS_MONTHS: 36,
  DATE_FORMAT: 10
}

type OutcomeTooltipProps = {
  totalOutcomeInBudget: number
  totalOutcomeOutOfBudget: number
  period: Period
  formatCurrency: (amount: number) => string
}

export function OutcomeTooltip({
  totalOutcomeInBudget,
  totalOutcomeOutOfBudget,
  period,
  formatCurrency
}: OutcomeTooltipProps) {
  const monthsToLive = useMonthsToLive(totalOutcomeInBudget + totalOutcomeOutOfBudget, period)
  const {t} = useTranslation('analytics')
  const hasInBalanceOutcome = totalOutcomeInBudget > 0
  const hasOutOfBalanceOutcome = totalOutcomeOutOfBudget > 0
  const showOutcomeSection = hasInBalanceOutcome || hasOutOfBalanceOutcome

  if (monthsToLive <= 0 && !showOutcomeSection)
    return null

  return (
    <Box p={1}>
      {monthsToLive > 0 && (
        <Typography variant="body2">
          {t('monthsToLive', {count: monthsToLive})}
        </Typography>
      )}

      {showOutcomeSection && (
        <>
          <Box mt={1.5} mb={0.5}>
            <Typography variant="body2" fontWeight="bold">
              {t('outcome')}:
            </Typography>
          </Box>

          {hasInBalanceOutcome && (
            <Typography variant="body2" display="flex"
                        justifyContent="space-between">
              <span>{t('fromFundsInBalance')}:</span>
              <span
                style={{marginLeft: 8}}>{formatCurrency(totalOutcomeInBudget)}</span>
            </Typography>
          )}

          {hasOutOfBalanceOutcome && (
            <Typography variant="body2" display="flex"
                        justifyContent="space-between">
              <span>{t('fromFundsSaving')}:</span>
              <span
                style={{marginLeft: 8}}>{formatCurrency(totalOutcomeOutOfBudget)}</span>
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}

function useMonthsToLive(totalOutcome: number, period: Period): number {
  // with period = LastYear it return 13 points max, so we need to get only 12,
  // but if it returns only 11 or less we need to divide by 11
  const netWorthPoints = useNetWorth(period, GroupBy.Month)
  const lastMonth = netWorthPoints.length > 0 ? netWorthPoints[netWorthPoints.length - 1] : null

  if (!lastMonth)
    return 0

  const currentBalance = lastMonth.lented +
    lastMonth.debts +
    lastMonth.accountDebts +
    lastMonth.fundsInBudget +
    lastMonth.fundsSaving

  const monthsInPeriod = useMonthsInPeriod(period)
  const months = monthsInPeriod >= netWorthPoints.length ? netWorthPoints.length : monthsInPeriod
  const monthlyOutcome = totalOutcome / months
  return Math.round(currentBalance / monthlyOutcome)
}

function useMonthsInPeriod(period: Period): number {
  const historyStart = useAppSelector(trModel.getHistoryStart)

  return useMemo(() => {
    switch (period) {
      case Period.LastYear:
        return CONSTANTS.DEFAULT_MONTHS
      case Period.ThreeYears:
        return CONSTANTS.THREE_YEARS_MONTHS
      case Period.All:
        const startDate = new Date(historyStart)
        const currentDate = new Date()
        const difference = differenceInMonths(currentDate, startDate)
        const monthsDiff = difference + 1
        return Math.max(1, monthsDiff)
      default:
        return CONSTANTS.DEFAULT_MONTHS
    }
  }, [period, historyStart])
}
