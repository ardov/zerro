import { addTransactionAmounts } from '../../zenmoney/model/money'
import type { ById, ByMonth } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type {
  TFxCode,
  TInstrument,
  TInstrumentId,
} from '../../zenmoney/entities/instruments'
import type { TISOMonth } from '../../zenmoney/primitives'
import {
  getTransactionType,
  TrType,
} from '../../zenmoney/entities/transactions'
import type { TTransaction } from '../../zenmoney/entities/transactions/types'
import type { TEnvelopeId } from '../envelope-id'
import {
  routeTransactionToActivity,
  type TTransactionActivityRoute,
  type TTransactionActivityRoutingContext,
} from './transactionRouting'

export type TRawActivityNode = {
  internal: EnvActivity
  income: Record<TEnvelopeId, EnvActivity>
  outcome: Record<TEnvelopeId, EnvActivity>
}

export type TBuildRawActivityInput = {
  transactions: TTransaction[]
  routing: TTransactionActivityRoutingContext
  instruments: ById<TInstrument>
  envelopeCurrencies: Readonly<Record<TEnvelopeId, TFxCode>>
}

export function buildRawActivity(
  input: TBuildRawActivityInput
): ByMonth<TRawActivityNode> {
  const result: ByMonth<TRawActivityNode> = {}

  input.transactions.forEach(transaction => {
    const route = routeTransactionToActivity(transaction, input.routing)
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
          input.instruments,
          getRecordedChange(transaction, route, input)
        )
        return
      case 'outcome':
        addOutcomeTransaction(
          transaction,
          route.month,
          route.envelopeId,
          result,
          input.instruments,
          getRecordedChange(transaction, route, input)
        )
    }
  })

  return result
}

type TActivityAmounts = Pick<EnvActivity, 'total' | 'trend'>

export class EnvActivity {
  total: TFxAmount = {}
  trend: TFxAmount[] = new Array(31).fill({}).map(() => ({}))
  transactionCount = 0
  /**
   * The envelope's view when a posting is replaced by an amount recorded in
   * the envelope currency. Totals above stay the account postings.
   */
  declare envelope?: TActivityAmounts

  static merge(
    activityA: EnvActivity | undefined,
    activityB: EnvActivity | undefined
  ): EnvActivity {
    if (!activityA && !activityB) return new EnvActivity()
    if (!activityA) return activityB!
    if (!activityB) return activityA

    const merged: EnvActivity = {
      ...mergeAmounts(activityA, activityB),
      transactionCount: activityA.transactionCount + activityB.transactionCount,
    }
    if (activityA.envelope || activityB.envelope) {
      merged.envelope = mergeAmounts(
        activityA.envelope ?? activityA,
        activityB.envelope ?? activityB
      )
    }
    return merged
  }
}

function mergeAmounts(
  a: TActivityAmounts,
  b: TActivityAmounts
): TActivityAmounts {
  return {
    total: addTransactionAmounts(a.total, b.total),
    trend: a.trend.map((value, index) =>
      addTransactionAmounts(value, b.trend[index])
    ),
  }
}

/**
 * An amount the transaction itself records in the envelope currency: the other
 * leg of a transfer across the budget boundary, or the original amount. The
 * envelope keeps it instead of a month-rate estimate of the account posting.
 */
function getRecordedChange(
  transaction: TTransaction,
  route: Extract<TTransactionActivityRoute, { envelopeId: TEnvelopeId }>,
  input: TBuildRawActivityInput
): TFxAmount | undefined {
  const currency = input.envelopeCurrencies[route.envelopeId]
  const code = (id: TInstrumentId | null) =>
    id === null ? undefined : input.instruments[id]?.shortTitle
  const isIncome = route.direction === 'income'
  const sign = isIncome ? 1 : -1
  const posting = isIncome
    ? transaction.incomeInstrument
    : transaction.outcomeInstrument
  if (!currency || code(posting) === currency) return

  const [otherLeg, otherAmount] = isIncome
    ? [transaction.outcomeInstrument, transaction.outcome]
    : [transaction.incomeInstrument, transaction.income]
  // A debt's other leg is technical.
  if (
    code(otherLeg) === currency &&
    isAmount(otherAmount) &&
    getTransactionType(transaction, input.routing.debtAccountId) ===
      TrType.Transfer
  )
    return { [currency]: sign * otherAmount }

  const [original, originalAmount] = isIncome
    ? [transaction.opIncomeInstrument, transaction.opIncome]
    : [transaction.opOutcomeInstrument, transaction.opOutcome]
  if (code(original) === currency && isAmount(originalAmount))
    return { [currency]: sign * originalAmount }
}

function isAmount(value: number | null): value is number {
  return value !== null && value > 0 && Number.isFinite(value)
}

function addInternalTransaction(
  transaction: TTransaction,
  month: TISOMonth,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>
) {
  const change = addTransactionAmounts(
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
  instruments: ById<TInstrument>,
  recorded: TFxAmount | undefined
) {
  const change = {
    [instruments[transaction.incomeInstrument].shortTitle]: transaction.income,
  }
  const node = (getMonthNode(result, month).income[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change, recorded)
}

function addOutcomeTransaction(
  transaction: TTransaction,
  month: TISOMonth,
  envelopeId: TEnvelopeId,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>,
  recorded: TFxAmount | undefined
) {
  const change = {
    [instruments[transaction.outcomeInstrument].shortTitle]:
      -transaction.outcome,
  }
  const node = (getMonthNode(result, month).outcome[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change, recorded)
}

function addToActivity(
  activity: EnvActivity,
  transaction: TTransaction,
  change: TFxAmount,
  recorded?: TFxAmount
) {
  const dayIndex = getISODateDayIndex(transaction.date)
  if (recorded)
    activity.envelope ??= { total: activity.total, trend: [...activity.trend] }
  if (activity.envelope)
    addAmounts(activity.envelope, dayIndex, recorded ?? change)
  activity.transactionCount += 1
  addAmounts(activity, dayIndex, change)
}

function addAmounts(
  amounts: TActivityAmounts,
  dayIndex: number,
  change: TFxAmount
) {
  amounts.total = addTransactionAmounts(amounts.total, change)
  amounts.trend[dayIndex] = addTransactionAmounts(
    amounts.trend[dayIndex],
    change
  )
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
