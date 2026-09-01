import type { TFunction } from 'i18next'
import type { TDateDraft, TFxAmount, TISOMonth } from '@/6-shared/types'
import { useTranslation } from 'react-i18next'
import { round } from '@/6-shared/helpers/money'
import { toISOMonth } from '@/6-shared/helpers/date'
import { getAverage } from '@/6-shared/helpers/money/currencyHelpers'

import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

export const useQuickActions = (
  month: TISOMonth,
  id?: core.envelopes.TEnvelopeId
) => {
  const { t } = useTranslation()
  const convertFx = useAppSelector(core.currency.selectConvertFx)
  const envMetrics = useAppSelector(core.activity.selectEnvelopeMetrics)
  const goals = useAppSelector(core.goals.selectAll)[month]
  if (!id) return []

  const envelope = envMetrics[month][id]
  if (!envelope) return []

  const convert = (a: TFxAmount | null) =>
    a ? convertFx(a, envelope.currency, month) : 0

  const prevMonth = getPrevMonth(month)
  const prevEnvelopeData = envMetrics[prevMonth]?.[id]

  const prevActivity: number[] = getPrev12MonthsISO(month)
    .map(month => envMetrics?.[month]?.[id]?.totalActivity)
    .filter(outcome => outcome !== undefined)
    .map(convert)

  return getQuickActions({
    t,
    hasChildren: envelope.children.length > 0,
    assigned: convert(envelope.selfAssigned),
    totalAssigned: convert(envelope.totalAssigned),
    available: convert(envelope.selfAvailable),
    totalAvailable: convert(envelope.totalAvailable),
    hasGoal: !!goals[id],
    goalTarget: goals[id]?.targetBudget || 0,
    prevOutcomesLength: prevActivity.length,
    avgOutcome: getAverage(prevActivity),
    prevAssigned: convert(prevEnvelopeData?.totalAssigned || {}),
    prevOutcome: convert(prevEnvelopeData?.totalActivity || {}),
  })
}

function getQuickActions({
  t,
  hasChildren,
  assigned,
  totalAssigned,
  available,
  totalAvailable,
  hasGoal,
  goalTarget,
  prevOutcomesLength,
  avgOutcome,
  prevAssigned,
  prevOutcome,
}: {
  t: TFunction
  hasChildren: boolean
  assigned: number
  totalAssigned: number
  available: number
  totalAvailable: number
  hasGoal: boolean
  goalTarget: number
  prevOutcomesLength: number
  avgOutcome: number
  prevAssigned: number
  prevOutcome: number
}) {
  return [
    {
      text: t('coverOverspend', { ns: 'quickBudgets' }),
      amount: round(+totalAssigned - available),
      condition: hasChildren && available < 0 && totalAvailable >= 0,
    },
    {
      text: t('coverOverspend', { ns: 'quickBudgets' }),
      amount: round(+totalAssigned - totalAvailable),
      condition: totalAvailable < 0,
    },
    {
      text: t('dropLeftover', { ns: 'quickBudgets' }),
      amount: round(+totalAssigned - totalAvailable),
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
      amount: prevAssigned,
      condition: !!prevAssigned,
    },
    {
      text: t('prevOutcome', { ns: 'quickBudgets' }),
      amount: -prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: t('sumOfChildren', { ns: 'quickBudgets' }),
      amount: round(totalAssigned - assigned),
      condition:
        hasChildren &&
        !!assigned &&
        !!totalAssigned &&
        assigned !== totalAssigned,
    },
  ].filter(action => action.condition)
}

function getPrev12MonthsISO(date: TDateDraft): TISOMonth[] {
  const prevMonths: TISOMonth[] = []
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
