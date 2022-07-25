import { getComputedTotals } from 'models/envelopes'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { convertFx, round } from 'shared/helpers/currencyHelpers'
import { toISOMonth } from 'shared/helpers/date'
import pluralize from 'shared/helpers/pluralize'
import { TDateDraft, TFxAmount, TISOMonth } from 'shared/types'
import { useAppSelector } from 'store'

export const useQuickActions = (month: TISOMonth, id?: TEnvelopeId) => {
  const totals = useAppSelector(getComputedTotals)
  if (!id) return []
  const monthInfo = totals[month]
  const envelope = totals[month]?.envelopes[id]
  if (!envelope) return []
  const envelopeCurrency = envelope.currency

  const convert = (a: TFxAmount | null) =>
    a ? convertFx(a, envelopeCurrency, monthInfo.rates) : 0

  const prevMonth = getPrevMonth(month)
  const prevEnvelopeData = totals[prevMonth]?.envelopes[id]

  let prevActivity: number[] = getPrev12MonthsISO(month)
    .map(month => totals?.[month]?.envelopes[id]?.activity)
    .filter(outcome => outcome !== undefined)
    .map(convert)

  return getQuickActions({
    hasChildren: envelope.children.length > 0,
    budgeted: convert(envelope.budgetedSelf),
    totalBudgeted: convert(envelope.budgeted),
    available: convert(envelope.availableSelf),
    totalAvailable: convert(envelope.available),
    hasGoal: !!envelope.goal,
    goalTarget: convert(envelope.goalTarget),
    prevOutcomesLength: prevActivity.length,
    avgOutcome: getAverage(prevActivity),
    prevBudgeted: convert(prevEnvelopeData?.budgeted || {}),
    prevOutcome: convert(prevEnvelopeData?.activity || {}),
  })
}

function getQuickActions({
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
      text: 'Покрыть перерасход',
      amount: round(+totalBudgeted - available),
      condition: hasChildren && available < 0 && totalAvailable >= 0,
    },
    {
      text: 'Покрыть перерасход',
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable < 0,
    },
    {
      text: 'Сбросить остаток',
      amount: round(+totalBudgeted - totalAvailable),
      condition: totalAvailable > 0,
    },
    {
      text: 'Цель',
      amount: goalTarget,
      condition: hasGoal && !!goalTarget,
    },
    {
      text: getAvgOutcomeName(prevOutcomesLength),
      amount: avgOutcome,
      condition: !!avgOutcome && prevOutcomesLength > 1,
    },
    {
      text: 'Прошлый бюджет',
      amount: prevBudgeted,
      condition: !!prevBudgeted,
    },
    {
      text: 'Прошлый расход',
      amount: prevOutcome,
      condition: !!prevOutcome,
    },
    {
      text: 'Сумма дочерних категорий',
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

function getAverage(outcomes: number[]) {
  if (!outcomes.length) return 0
  let sum = 0
  outcomes.forEach(outcome => (sum += outcome))
  return round(sum / outcomes.length)
}

function getAvgOutcomeName(number: number) {
  const s = 'Средний расход за '
  if (number === 12) return s + 'год'
  if (number === 6) return s + 'полгода'
  return s + number + ' ' + pluralize(number, ['месяц', 'месяца', 'месяцев'])
}
