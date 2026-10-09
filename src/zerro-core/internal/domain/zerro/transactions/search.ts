import type { TTransaction } from '../../zenmoney/entities/transactions/types'
import {
  getTransactionType,
  TrType,
} from '../../zenmoney/entities/transactions'

/** Entity names come from the same snapshot as the operations being searched. */
export type TTransactionSearchContext = {
  accounts: Readonly<Record<string, { title: string }>>
  tags: Readonly<Record<string, { title: string }>>
  merchants: Readonly<Record<string, { title: string }>>
}

export function compileTransactionSearch(
  value: string,
  context?: TTransactionSearchContext,
  debtAccountId?: string
): (transaction: TTransaction) => boolean {
  const words = value.trim().toUpperCase().split(/\s+/).filter(Boolean)
  const names = (entities: Readonly<Record<string, { title: string }>> = {}) =>
    new Map(
      Object.entries(entities).map(([id, entity]) => [
        id,
        entity.title.toUpperCase(),
      ])
    )
  const accounts = names(context?.accounts)
  const tags = names(context?.tags)
  const merchants = names(context?.merchants)
  const tokens = words.map(word => ({
    word,
    amount: /^\d+(?:[.,]\d+)?$/.test(word)
      ? Number(word.replace(',', '.'))
      : undefined,
  }))

  return transaction => {
    const text = [
      transaction.comment?.toUpperCase(),
      transaction.payee?.toUpperCase(),
      transaction.originalPayee?.toUpperCase(),
      merchants.get(transaction.merchant ?? ''),
      accounts.get(transaction.incomeAccount ?? ''),
      accounts.get(transaction.outcomeAccount ?? ''),
      ...(transaction.tag ?? []).map(id => tags.get(id)),
    ]
    const type = getTransactionType(transaction, debtAccountId)
    const amounts: Array<number | null> = []
    if (type !== TrType.Outcome && type !== TrType.OutcomeDebt) {
      amounts.push(transaction.income)
      if (transaction.opIncomeInstrument != null)
        amounts.push(transaction.opIncome)
    }
    if (type !== TrType.Income && type !== TrType.IncomeDebt) {
      amounts.push(transaction.outcome)
      if (transaction.opOutcomeInstrument != null)
        amounts.push(transaction.opOutcome)
    }
    return tokens.every(
      ({ word, amount }) =>
        text.some(field => field?.includes(word)) ||
        (amount !== undefined && amounts.includes(amount))
    )
  }
}
