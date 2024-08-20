import type { TFunction } from 'i18next'
import type { TDateDraft, TFxAmount, TISOMonth } from '6-shared/types'
import type { TEnvelopeId } from '5-entities/envelope'
import { useTranslation } from 'react-i18next'
import { round } from '6-shared/helpers/money'
import { toISOMonth } from '6-shared/helpers/date'

import { balances } from '5-entities/envBalances'
import { goalModel } from '5-entities/goal'
import { fxRateModel } from '5-entities/currency/fxRate'
import { getAverage } from "../../../6-shared/helpers/money/currencyHelpers";

export const useQuickActions = (month: TISOMonth, id?: TEnvelopeId) => {
  const { t } = useTranslation()
  const convertFx = fxRateModel.useConverter()
  const envMetrics = balances.useEnvData()
  const goals = goalModel.useGoals()[month]
  if (!id) return []

  const envelope = envMetrics[month][id]
  if (!envelope) return []

  const convert = (a: TFxAmount | null) =>
    a ? convertFx(a, envelope.currency, month) : 0

  const prevMonth = getPrevMonth(month)
  const prevEnvelopeData = envMetrics[prevMonth]?.[id]

  let prevActivity: number[] = getPrev12MonthsISO(month)
    .map(month => envMetrics?.[month]?.[id]?.totalActivity)
    .filter(outcome => outcome !== undefined)
    .map(convert)

  return getQuickActions({
    t,
    hasChildren: envelope.children.length > 0,
    budgeted: convert(envelope.selfBudgeted),
    totalBudgeted: convert(envelope.totalBudgeted),
    available: convert(envelope.selfAvailable),
    totalAvailable: convert(envelope.totalAvailable),
    hasGoal: !!goals[id],
    goalTarget: goals[id]?.targetBudget || 0,
    prevOutcomesLength: prevActivity.length,
    avgOutcome: getAverage(prevActivity),
    prevBudgeted: convert(prevEnvelopeData?.totalBudgeted || {}),
    prevOutcome: convert(prevEnvelopeData?.totalActivity || {}),
  })
}

function getQuickActions({
  t,
  hasChildren,
  budgeted,
  totalBudgeted,
  available,
  totalAvailable,
  hasGoal,
  goalTarget,
  prevOutcomesLength,
  avgOutcome,
  prevBudgeted,
  prevOutcome,
}: {
  t: TFunction
  hasChildren: boolean
  budgeted: number
  totalBudgeted: number
  available: number
  totalAvailable: number
  hasGoal: boolean
  goalTarget: number
  prevOutcomesLength: number
  avgOutcome: number
  prevBudgeted: number
  prevOutcome: number
}) {
  return [
    {
      text: t('coverOverspend', { ns: 'quickBudgets' }),
      amount: round(+totalBudgeted - available),
      condition: hasChildren && available < 0 && totalAvailable >= 0,
    },
    {
      text: t('coverOverspend', { ns: 'quickBudgets' }),
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable < 0,
    },
    {
      text: t('dropLeftover', { ns: 'quickBudgets' }),
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable > 0,
    },
    {
      text: t('goal', { ns: 'quickBudgets' }),
      amount: goalTarget,
      condition: hasGoal && !!goalTarget,
    },
    {
      text: getAvgOutcomeName(t, prevOutcomesLength),
      amount: -avgOutcome,
      condition: !!avgOutcome && prevOutcomesLength > 1,
    },
    {
      text: t('prevBudget', { ns: 'quickBudgets' }),
      amount: prevBudgeted,
      condition: !!prevBudgeted,
    },
    {
      text: t('prevOutcome', { ns: 'quickBudgets' }),
      amount: -prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: t('sumOfChildren', { ns: 'quickBudgets' }),
      amount: round(totalBudgeted - budgeted),
      condition:
        hasChildren &&
        !!budgeted &&
        !!totalBudgeted &&
        budgeted !== totalBudgeted,
    },
  ].filter(action => action.condition)
}

function getPrev12MonthsISO(date: TDateDraft): TISOMonth[] {
  let prevMonths: TISOMonth[] = []
  let monthToAdd = toISOMonth(date) // current month won't be added; only use it to get previous month
  for (let i = 0; i < 12; i++) {
    monthToAdd = getPrevMonth(monthToAdd)
    prevMonths.push(monthToAdd)
  }
  return prevMonths
}

function getPrevMonth(date: TDateDraft): TISOMonth {
  const current = new Date(date)
  const yyyy = current.getFullYear()
  const mm = current.getMonth() - 1
  return toISOMonth(new Date(yyyy, mm))
}

function getAvgOutcomeName(t: TFunction, count: number) {
  if (count === 12) return t('avgOutcome_year', { ns: 'quickBudgets' })
  if (count === 6) return t('avgOutcome_halfYear', { ns: 'quickBudgets' })
  return t('avgOutcome', { ns: 'quickBudgets', count })
}
