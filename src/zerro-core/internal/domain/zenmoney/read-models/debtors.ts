import { round } from '../../foundation/numbers'
import type { ById } from '../../foundation/types'
import type { TAccountId } from '../entities/accounts'
import type { TFxAmount } from '../model/money'
import type { TInstrument } from '../entities/instruments'
import type { TMerchant, TMerchantId } from '../entities/merchants'
import type { TTransaction } from '../entities/transactions/types'
import { getTransactionType, TrType } from '../entities/transactions'

export type TDebtor = {
  id: string
  name: string
  merchantId?: TMerchantId
  merchantName?: string
  payeeNames: string[]
  transactions: TTransaction[]
  balance: TFxAmount
}

export type TBuildDebtorsInput = {
  transactions: TTransaction[]
  merchants: ById<TMerchant>
  instruments: ById<TInstrument>
  debtAccountId?: TAccountId
}

export function buildDebtors(input: TBuildDebtorsInput): ById<TDebtor> {
  const debtors: ById<TDebtor> = {}

  input.transactions.forEach(transaction => {
    const transactionType = getTransactionType(transaction, input.debtAccountId)
    if (
      transactionType !== TrType.IncomeDebt &&
      transactionType !== TrType.OutcomeDebt
    ) {
      return
    }

    const debtor = getTransactionDebtor(transaction, input.merchants, debtors)
    if (!debtor) return

    if (transactionType === TrType.IncomeDebt) {
      const fxCode = input.instruments[transaction.incomeInstrument].shortTitle
      debtor.balance[fxCode] ??= 0
      debtor.balance[fxCode] = round(
        debtor.balance[fxCode] - transaction.income
      )
      return
    }

    const fxCode = input.instruments[transaction.outcomeInstrument].shortTitle
    debtor.balance[fxCode] ??= 0
    debtor.balance[fxCode] = round(debtor.balance[fxCode] + transaction.outcome)
  })

  return debtors
}

/** Canonical payee key used by ZenMoney. */
export function normalizePayee(name: string | null | undefined) {
  return (name || '')
    .replace(/[\s.,;!?():\-"'&«»„”`*]+/g, ' ')
    .trim()
    .toLowerCase()
}

function getTransactionDebtor(
  transaction: TTransaction,
  merchants: ById<TMerchant>,
  debtors: ById<TDebtor>
): TDebtor | undefined {
  if (transaction.merchant) {
    const merchant = merchants[transaction.merchant]
    const id = normalizePayee(merchant.title)
    const debtor = (debtors[id] ??= makeDebtorFromMerchant(merchant))
    debtor.merchantId = merchant.id
    debtor.merchantName = merchant.title
    debtor.transactions.push(transaction)
    return debtor
  }

  if (!transaction.payee) return undefined

  const id = normalizePayee(transaction.payee)
  const debtor = (debtors[id] ??= makeDebtorFromPayee(transaction.payee))
  if (!debtor.payeeNames.includes(transaction.payee)) {
    debtor.payeeNames.push(transaction.payee)
  }
  debtor.transactions.push(transaction)
  return debtor
}

function makeDebtorFromMerchant(merchant: TMerchant): TDebtor {
  return {
    id: normalizePayee(merchant.title),
    name: merchant.title,
    merchantId: merchant.id,
    merchantName: merchant.title,
    payeeNames: [],
    transactions: [],
    balance: {},
  }
}

function makeDebtorFromPayee(payee: string): TDebtor {
  return {
    id: normalizePayee(payee),
    name: payee,
    merchantId: undefined,
    merchantName: undefined,
    payeeNames: [payee],
    transactions: [],
    balance: {},
  }
}
