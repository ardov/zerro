import { toISOMonth } from '../../foundation/date'
import type { ById } from '../../foundation/types'
import type { TAccountId } from '../../zenmoney/entities/accounts'
import { normalizePayee } from '../../zenmoney/read-models/debtors'
import type { TISOMonth } from '../../zenmoney/primitives'
import {
  getTransactionType,
  TrType,
} from '../../zenmoney/entities/transactions'
import type { TTransaction } from '../../zenmoney/entities/transactions/types'
import { EnvType, envId, type TEnvelopeId } from '../envelope-id'
import type { TEnvelopeDebtor } from '../envelopes'

export type TTransactionActivityRoutingContext = {
  inBudgetAccountIds: ReadonlySet<TAccountId>
  debtAccountId: TAccountId | undefined
  debtors: ById<Pick<TEnvelopeDebtor, 'id' | 'merchantId'>>
}

/**
 * Builds the routing context once. Both consumers of
 * {@link routeTransactionToActivity} — the bulk `buildRawActivity` projection
 * and the per-transaction filter predicate — must share one context, or the
 * transaction filter and the budget table can disagree about the same
 * transaction. `inBudgetAccountIds` stays an array upstream so the Redux
 * adapter can keep its shallow result-equality check on it.
 */
export function buildActivityRoutingContext(input: {
  inBudgetAccountIds: readonly TAccountId[]
  debtAccountId: TAccountId | undefined
  debtors: ById<Pick<TEnvelopeDebtor, 'id' | 'merchantId'>>
}): TTransactionActivityRoutingContext {
  return {
    inBudgetAccountIds: new Set(input.inBudgetAccountIds),
    debtAccountId: input.debtAccountId,
    debtors: input.debtors,
  }
}

export type TTransactionActivityRoute =
  | {
      month: TISOMonth
      direction: 'internal'
    }
  | {
      month: TISOMonth
      direction: 'income' | 'outcome'
      envelopeId: TEnvelopeId
    }

export function routeTransactionToActivity(
  transaction: TTransaction,
  context: TTransactionActivityRoutingContext
): TTransactionActivityRoute | null {
  // A soft-deleted row can carry a nulled leg. It moves no money, so it
  // belongs to no month's activity.
  if (transaction.incomeAccount === null || transaction.outcomeAccount === null)
    return null

  const fromBudget = context.inBudgetAccountIds.has(transaction.outcomeAccount)
  const toBudget = context.inBudgetAccountIds.has(transaction.incomeAccount)

  if (!fromBudget && !toBudget) return null

  const type = getTransactionType(transaction, context.debtAccountId)
  const month = toISOMonth(transaction.date)

  if (type === TrType.Transfer && fromBudget && toBudget) {
    if (
      transaction.income === transaction.outcome &&
      transaction.incomeInstrument === transaction.outcomeInstrument
    ) {
      return null
    }
    return { month, direction: 'internal' }
  }

  if (
    type === TrType.Outcome ||
    type === TrType.OutcomeDebt ||
    (type === TrType.Transfer && fromBudget)
  ) {
    return {
      month,
      direction: 'outcome',
      envelopeId: getEnvelopeId(transaction, type, 'outcome', context.debtors),
    }
  }

  if (
    type === TrType.Income ||
    type === TrType.IncomeDebt ||
    (type === TrType.Transfer && toBudget)
  ) {
    return {
      month,
      direction: 'income',
      envelopeId: getEnvelopeId(transaction, type, 'income', context.debtors),
    }
  }

  return null
}

function getEnvelopeId(
  transaction: TTransaction,
  type: TrType,
  direction: 'income' | 'outcome',
  debtors: ById<Pick<TEnvelopeDebtor, 'id' | 'merchantId'>>
): TEnvelopeId {
  switch (type) {
    case TrType.Income:
    case TrType.Outcome:
      return envId.get(EnvType.Tag, transaction.tag?.[0] || 'null')

    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return getDebtorEnvelopeId(transaction, debtors)

    case TrType.Transfer:
      return envId.get(
        EnvType.Account,
        direction === 'outcome'
          ? transaction.incomeAccount
          : transaction.outcomeAccount
      )
  }
}

function getDebtorEnvelopeId(
  transaction: TTransaction,
  debtors: ById<Pick<TEnvelopeDebtor, 'id' | 'merchantId'>>
): TEnvelopeId {
  if (transaction.merchant) {
    return envId.get(EnvType.Merchant, transaction.merchant)
  }

  const normalizedName = normalizePayee(transaction.payee)
  const debtor = debtors[normalizedName]

  return debtor.merchantId
    ? envId.get(EnvType.Merchant, debtor.merchantId)
    : envId.get(EnvType.Payee, normalizedName)
}
