import { toISOMonth } from '../../shared/date'
import type { ById } from '../../shared/types'
import type { TAccountId } from '../../zenmoney/accounts/types'
import { cleanPayee } from '../../zenmoney/debtors'
import type { TISOMonth } from '../../zenmoney/primitives'
import { getTransactionType, TrType } from '../../zenmoney/transactions'
import type { TTransaction } from '../../zenmoney/transactions/types'
import { EnvType, envId, type TEnvelopeId } from '../envelope-id'
import type { TEnvelopeDebtor } from '../envelopes'

export type TTransactionActivityRoutingContext = {
  inBudgetAccountIds: ReadonlySet<TAccountId>
  debtAccountId: TAccountId | undefined
  debtors: ById<Pick<TEnvelopeDebtor, 'id' | 'merchantId'>>
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

  const cleanName = cleanPayee(String(transaction.payee))
  const debtor = debtors[cleanName]

  return debtor.merchantId
    ? envId.get(EnvType.Merchant, debtor.merchantId)
    : envId.get(EnvType.Payee, cleanName)
}
