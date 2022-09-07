import { getInBudgetAccounts } from '@entities/account'
import { getMonthTotals } from '@entities/envelopeData'
import { TFxRates } from '@entities/fxRate/fxRateStore'
import { useDisplayCurrency } from '@entities/instrument/hooks'
import { toISOMonth } from '@shared/helpers/date'
import { convertFx, formatMoney, sub } from '@shared/helpers/money'
import pluralize from '@shared/helpers/pluralize'
import { TFxCode, TFxAmount, TISOMonth } from '@shared/types'
import { useAppSelector } from '@store/index'
import { FC } from 'react'

export const Explainer: FC<{ month: TISOMonth }> = ({ month }) => {
  const totals = useAppSelector(getMonthTotals)[month]
  const inBalanceAccounts = useAppSelector(getInBudgetAccounts).length
  const displayCurrency = useDisplayCurrency()

  const str = explainMe({
    isPast: toISOMonth(new Date()) > month,
    displayCurrency,
    inBalanceAccounts,
    totalFunds: totals.fundsEnd,
    rates: totals.rates,
    allocatedNow: totals.available,
    allocatedInFuture: totals.budgetedInFuture,
  })

  return <span>{str}</span>
}

function explainMe(p: {
  isPast: boolean
  displayCurrency: TFxCode
  inBalanceAccounts: number
  totalFunds: TFxAmount
  rates: TFxRates
  allocatedNow: TFxAmount
  allocatedInFuture: TFxAmount
}) {
  const accsCount = p.inBalanceAccounts
  const funds = convertFx(p.totalFunds, p.displayCurrency, p.rates)
  const allocatedNow = convertFx(p.allocatedNow, p.displayCurrency, p.rates)
  const allocatedInFuture = convertFx(
    p.allocatedInFuture,
    p.displayCurrency,
    p.rates
  )
  const currencies = Object.keys(p.totalFunds).filter(fx => p.totalFunds[fx])
  const currCount = currencies.length
  const freeNow = sub(funds, allocatedNow)
  const allocatedForFuture =
    freeNow <= 0
      ? 0
      : allocatedInFuture >= freeNow
      ? freeNow
      : allocatedInFuture
  const toBeBudgeted = sub(funds, allocatedNow, allocatedForFuture)

  const formatSum = (n: number) => formatMoney(n, p.displayCurrency)

  const sAccs = pluralize(accsCount, [
    `${accsCount} счёт участвует в балансе.`,
    `${accsCount} счёта участвуют в балансе.`,
    `${accsCount} счётов участвуют в балансе.`,
  ])

  const sFx =
    currCount > 1
      ? pluralize(currCount, [
          ` (сумма в ${currCount} валюте)`,
          ` (сумма в ${currCount} валютах)`,
          ` (сумма в ${currCount} валютах)`,
        ])
      : ''
  const sFunds = p.isPast
    ? `На них было в конце месяца ${formatSum(funds)}${sFx}.`
    : `На них сейчас ${formatSum(funds)}${sFx}.`

  const sAllocNow = allocatedNow
    ? `${formatSum(allocatedNow)} распределено по конвертам`
    : ''
  const sAllocFuture = allocatedInFuture
    ? `${formatSum(allocatedInFuture)} распределено в будущем`
    : ''
  const sAllocTotal = [sAllocNow, sAllocFuture].filter(Boolean).join(', а ещё ')
  const sAlloc = sAllocTotal
    ? `Из них ${sAllocTotal}.`
    : `Эти деньги не распределены по конвертам.`

  const sFin =
    toBeBudgeted > 0
      ? `А значит, можно распределить ещё ${formatSum(toBeBudgeted)}`
      : toBeBudgeted === 0
      ? `А значит, все деньги в бюджете распределены.`
      : `А значит, вы распределили на ${formatSum(
          -toBeBudgeted
        )} больше чем у вас есть.`

  return [sAccs, sFunds, sAlloc, sFin].join(' ')
}
