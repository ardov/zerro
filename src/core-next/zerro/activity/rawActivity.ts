import { toISOMonth } from '6-shared/helpers/date'
import { addFxAmount } from '6-shared/helpers/money'
import type {
  ById,
  ByMonth,
  TAccountId,
  TFxAmount,
  TInstrument,
  TTransaction,
} from '6-shared/types'
import {
  compareTransactionDates,
  getTransactionType,
  TrType,
} from '../../zenmoney'
import { EnvType, envId, TEnvelopeId } from '../envelope-id'
import type { TEnvelopeDebtor } from '../envelopes'

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

  input.transactions.forEach(transaction => {
    const fromBudget = input.inBudgetAccountIds.includes(transaction.outcomeAccount)
    const toBudget = input.inBudgetAccountIds.includes(transaction.incomeAccount)
    const type = getTransactionType(transaction, input.debtAccountId)

    if (!fromBudget && !toBudget) return

    if (type === TrType.Transfer && fromBudget && toBudget) {
      addInternalTransaction(transaction, result, input.instruments)
      return
    }

    if (
      type === TrType.Outcome ||
      type === TrType.OutcomeDebt ||
      (type === TrType.Transfer && fromBudget)
    ) {
      addOutcomeTransaction(transaction, result, input)
      return
    }

    if (
      type === TrType.Income ||
      type === TrType.IncomeDebt ||
      (type === TrType.Transfer && toBudget)
    ) {
      addIncomeTransaction(transaction, result, input)
    }
  })

  return result
}

export class EnvActivity {
  total: TFxAmount = {}
  trend: TFxAmount[] = new Array(31).fill({}).map(() => ({}))
  transactions: TTransaction[] = []

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
      transactions: [...activityA.transactions, ...activityB.transactions].sort(
        compareTransactionDates
      ),
    }
  }
}

function addInternalTransaction(
  transaction: TTransaction,
  result: ByMonth<TRawActivityNode>,
  instruments: ById<TInstrument>
) {
  if (
    transaction.income === transaction.outcome &&
    transaction.incomeInstrument === transaction.outcomeInstrument
  ) {
    return
  }

  const change = addFxAmount(
    { [instruments[transaction.incomeInstrument].shortTitle]: transaction.income },
    {
      [instruments[transaction.outcomeInstrument].shortTitle]:
        -transaction.outcome,
    }
  )
  const node = getMonthNode(result, transaction).internal
  addToActivity(node, transaction, change)
}

function addIncomeTransaction(
  transaction: TTransaction,
  result: ByMonth<TRawActivityNode>,
  input: TBuildRawActivityInput
) {
  const change = {
    [input.instruments[transaction.incomeInstrument].shortTitle]:
      transaction.income,
  }
  const envelopeId = getEnvelopeId(transaction, 'income', input)
  const node = (getMonthNode(result, transaction).income[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change)
}

function addOutcomeTransaction(
  transaction: TTransaction,
  result: ByMonth<TRawActivityNode>,
  input: TBuildRawActivityInput
) {
  const change = {
    [input.instruments[transaction.outcomeInstrument].shortTitle]:
      -transaction.outcome,
  }
  const envelopeId = getEnvelopeId(transaction, 'outcome', input)
  const node = (getMonthNode(result, transaction).outcome[envelopeId] ??=
    new EnvActivity())

  addToActivity(node, transaction, change)
}

function addToActivity(
  activity: EnvActivity,
  transaction: TTransaction,
  change: TFxAmount
) {
  const dayIndex = new Date(transaction.date).getDate() - 1
  activity.transactions.push(transaction)
  activity.total = addFxAmount(activity.total, change)
  activity.trend[dayIndex] = addFxAmount(activity.trend[dayIndex], change)
}

function getMonthNode(
  result: ByMonth<TRawActivityNode>,
  transaction: TTransaction
) {
  const month = toISOMonth(transaction.date)
  return (result[month] ??= makeMonthNode())
}

function makeMonthNode(): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
  }
}

function getEnvelopeId(
  transaction: TTransaction,
  direction: 'income' | 'outcome',
  input: TBuildRawActivityInput
): TEnvelopeId {
  const type = getTransactionType(transaction, input.debtAccountId)

  switch (type) {
    case TrType.Income:
    case TrType.Outcome:
      return envId.get(EnvType.Tag, transaction.tag?.[0] || 'null')

    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return getDebtorEnvelopeId(transaction, input.debtors)

    case TrType.Transfer:
      if (direction === 'outcome') {
        return envId.get(EnvType.Account, transaction.incomeAccount)
      }
      if (direction === 'income') {
        return envId.get(EnvType.Account, transaction.outcomeAccount)
      }
      throw new Error('Unknown direction: ' + direction)

    default:
      throw new Error('Unknown transaction type: ' + type)
  }
}

function getDebtorEnvelopeId(
  transaction: TTransaction,
  debtors: ById<TEnvelopeDebtor>
): TEnvelopeId {
  if (transaction.merchant) return envId.get(EnvType.Merchant, transaction.merchant)

  const cleanName = cleanPayee(String(transaction.payee))
  const debtor = debtors[cleanName]

  return debtor.merchantId
    ? envId.get(EnvType.Merchant, debtor.merchantId)
    : envId.get(EnvType.Payee, cleanName)
}

function cleanPayee(name: string) {
  return name.replace(/[^\d\wа-яА-ЯёЁ]/g, '').toLowerCase()
}
