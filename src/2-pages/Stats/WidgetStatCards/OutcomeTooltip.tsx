import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { addFxAmount, round, isZero } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { accBalanceModel } from '5-entities/accBalances'
import { AccountType, TISODate, TFxAmount } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { accountModel } from '5-entities/account'
import { getStart, Period } from '../shared/period'
import { GroupBy, toGroup } from '6-shared/helpers/date'
import { trModel, TrType } from '5-entities/transaction'
import { useAppSelector } from 'store'
import { differenceInMonths } from 'date-fns'
import { instrumentModel } from '5-entities/currency/instrument'

const CONSTANTS = {
  DECIMAL_PRECISION: 1,
  DEFAULT_MONTHS: 12,
  THREE_YEARS_MONTHS: 36,
  DATE_FORMAT: 10
}

type OutcomeTooltipProps = {
  totalOutcome: number
  period: Period
  formatCurrency: (amount: number) => string
}

type OutcomeByAccountType = {
  inBalanceOutcome: TFxAmount
  outOfBalanceOutcome: TFxAmount
}

type Account = {
  inBalance?: boolean
  type?: AccountType
  [key: string]: any
}

type BalanceNode = {
  balances: {
    accounts: Record<string, number>
    debtors: Record<string, any>
  }
  [key: string]: any
}

export function OutcomeTooltip({
  totalOutcome,
  period,
  formatCurrency
}: OutcomeTooltipProps) {
  const monthsToLive = useMonthsToLive(totalOutcome, period)
  const {inBalanceOutcome, outOfBalanceOutcome} = useOutcomeByAccountType(period)
  const {t} = useTranslation('analytics')
  const toDisplay = displayCurrency.useToDisplay('current')

  const hasInBalanceOutcome = !isZero(inBalanceOutcome)
  const hasOutOfBalanceOutcome = !isZero(outOfBalanceOutcome)
  const showOutcomeSection = hasInBalanceOutcome || hasOutOfBalanceOutcome

  if (monthsToLive <= 0 && !showOutcomeSection)
    return null

  return (
    <Box p={1}>
      {monthsToLive > 0 && (
        <Typography variant="body2">
          {t('monthsToLive', { count: monthsToLive })}
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
            <Typography variant="body2" display="flex" justifyContent="space-between">
              <span>{t('fromFundsInBalance')}:</span>
              <span style={{marginLeft: 8}}>{formatCurrency(toDisplay(inBalanceOutcome))}</span>
            </Typography>
          )}

          {hasOutOfBalanceOutcome && (
            <Typography variant="body2" display="flex" justifyContent="space-between">
              <span>{t('fromFundsSaving')}:</span>
              <span style={{marginLeft: 8}}>{formatCurrency(toDisplay(outOfBalanceOutcome))}</span>
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}

function getStartDate(
  period: Period,
  aggregation: GroupBy,
  historyStart?: TISODate
): TISODate {
  if (!historyStart) return toGroup(Date.now(), aggregation)
  const historyStartGroup = toGroup(historyStart, aggregation)
  const periodStart = getStart(period, aggregation)
  if (!periodStart) return historyStartGroup
  return historyStartGroup > periodStart ? historyStartGroup : periodStart
}

export function useOutcomeByAccountType(period: Period): OutcomeByAccountType {
  const transactionHistory = trModel.useTransactionsHistory()
  const debtAccId = accountModel.useDebtAccountId()
  const instCodeMap = instrumentModel.useInstCodeMap()
  const accounts = accountModel.usePopulatedAccounts() as Record<string, Account>
  const historyStart = useAppSelector(trModel.getHistoryStart)

  return useMemo(() => {
    let inBalanceOutcome: TFxAmount = {}
    let outOfBalanceOutcome: TFxAmount = {}
    const startDate = getStartDate(period, GroupBy.Month, historyStart)

    transactionHistory.forEach(tr => {
      if (tr.date < startDate) return

      const type = trModel.getType(tr, debtAccId)

      if (type === TrType.Outcome) {
        const account = accounts[tr.outcomeAccount]
        const outcomeCurrency = instCodeMap[tr.outcomeInstrument]
        const outcomeAmount: TFxAmount = { [outcomeCurrency]: tr.outcome }

        if (account?.inBalance) {
          inBalanceOutcome = addFxAmount(inBalanceOutcome, outcomeAmount)
        } else {
          outOfBalanceOutcome = addFxAmount(outOfBalanceOutcome, outcomeAmount)
        }
      }
    })

    return { inBalanceOutcome, outOfBalanceOutcome }
  }, [transactionHistory, debtAccId, instCodeMap, accounts, period, historyStart])
}

export function useFundsInBudget(): number {
  const accs = accountModel.usePopulatedAccounts() as Record<string, Account>
  const balanceNodes = accBalanceModel.useDisplayBalances(GroupBy.Day) as BalanceNode[]

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

export function useMonthsInPeriod(period: Period): number {
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
        const monthsDiff = differenceInMonths(currentDate, startDate) + 1
        return Math.max(1, monthsDiff)
      default:
        return CONSTANTS.DEFAULT_MONTHS
    }
  }, [period, historyStart])
}

export function useMonthsToLive(totalOutcome: number, period: Period): number {
  const fundsInBudget = useFundsInBudget()
  const monthsInPeriod = useMonthsInPeriod(period)

  return useMemo(() => {
    const monthlyOutcome = totalOutcome / monthsInPeriod
    return Math.round(fundsInBudget / monthlyOutcome)
  }, [fundsInBudget, totalOutcome, monthsInPeriod])
}
