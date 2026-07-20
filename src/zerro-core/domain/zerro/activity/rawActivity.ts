import { addFxAmount } from '../../shared/money'
import type { ById, ByMonth } from '../../shared/types'
import type { TAccountId } from '../../zenmoney/accounts/types'
import type { TFxAmount } from '../../shared/money'
import type { TInstrument } from '../../zenmoney/instruments'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TTransaction } from '../../zenmoney/transactions/types'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvelopeDebtor } from '../envelopes'
import { routeTransactionToActivity } from './transactionRouting'

export type TRawActivityNode = {
  internal: EnvActivity
  income: Record<TEnvelopeId, EnvActivity>
  outcome: Record<TEnvelopeId, EnvActivity>
}

export type TBuildRawActivityInput = {
  transactions: TTransaction[]
  inBudgetAccountIds: TAccountId[]
  debtAccountId: TAccountId | undefined
  debtors: ById<TEnvelopeDebtor>
  instruments: ById<TInstrument>
}

export function buildRawActivity(
  input: TBuildRawActivityInput
): ByMonth<TRawActivityNode> {
  const result: ByMonth<TRawActivityNode> = {}
  const routingContext = {
    inBudgetAccountIds: new Set(input.inBudgetAccountIds),
    debtAccountId: input.debtAccountId,
    debtors: input.debtors,
  }

  input.transactions.forEach(transaction => {
    const route = routeTransactionToActivity(transaction, routingContext)
    if (!route) return

    switch (route.direction) {
      case 'internal':
        addInternalTransaction(
          transaction,
          route.month,
          result,
          input.instruments
        )
        return
      case 'income':
        addIncomeTransaction(
          transaction,
          route.month,
          route.envelopeId,
          result,
          input.instruments
        )
        return
      case 'outcome':
        addOutcomeTransaction(
          transaction,
          route.month,
          route.envelopeId,
          result,
          input.instruments
        )
    }
  })

  return result
}

export class EnvActivity {
  total: TFxAmount = {}
  trend: TFxAmount[] = new Array(31).fill({}).map(() => ({}))
  transactionCount = 0

  static merge(
    activityA: EnvActivity | undefined,
    activityB: EnvActivity | undefined
  ): EnvActivity {
    if (!activityA && !activityB) return new EnvActivity()
    if (!activityA) return activityB!
    if (!activityB) return activityA

    return {
      total: addFxAmount(activityA.total, activityB.total),
      trend: activityA.trend.map((value, index) =>
        addFxAmount(value, activityB.trend[index])
      ),
      transactionCount: activityA.transactionCount + activityB.transactionCount,
    }
  }
}

function addInternalTransaction(
  transaction: TTransaction,
  month: TISOMonth,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>
) {
  const change = addFxAmount(
    {
      [instruments[transaction.incomeInstrument].shortTitle]:
        transaction.income,
    },
    {
      [instruments[transaction.outcomeInstrument].shortTitle]:
        -transaction.outcome,
    }
  )
  const node = getMonthNode(result, month).internal
  addToActivity(node, transaction, change)
}

function addIncomeTransaction(
  transaction: TTransaction,
  month: TISOMonth,
  envelopeId: TEnvelopeId,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>
) {
  const change = {
    [instruments[transaction.incomeInstrument].shortTitle]: transaction.income,
  }
  const node = (getMonthNode(result, month).income[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change)
}

function addOutcomeTransaction(
  transaction: TTransaction,
  month: TISOMonth,
  envelopeId: TEnvelopeId,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>
) {
  const change = {
    [instruments[transaction.outcomeInstrument].shortTitle]:
      -transaction.outcome,
  }
  const node = (getMonthNode(result, month).outcome[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change)
}

function addToActivity(
  activity: EnvActivity,
  transaction: TTransaction,
  change: TFxAmount
) {
  const dayIndex = getISODateDayIndex(transaction.date)
  activity.transactionCount += 1
  activity.total = addFxAmount(activity.total, change)
  activity.trend[dayIndex] = addFxAmount(activity.trend[dayIndex], change)
}

function getISODateDayIndex(date: string): number {
  return Number(date.slice(8, 10)) - 1
}

function getMonthNode(
  result: ByMonth<TRawActivityNode>,
  month: TISOMonth
): TRawActivityNode {
  return (result[month] ??= makeMonthNode())
}

function makeMonthNode(): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
  }
}
