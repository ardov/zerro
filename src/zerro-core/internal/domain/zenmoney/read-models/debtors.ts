import { round } from '../../foundation/numbers'
import type { ById } from '../../foundation/types'
import type { TAccountId } from '../entities/accounts'
import type { TFxAmount } from '../model/money'
import type { TInstrument } from '../entities/instruments'
import {
  normalizePayee,
  type TMerchant,
  type TMerchantId,
} from '../entities/merchants'
import type { TTransaction } from '../entities/transactions/types'
import {
  getTransactionMoney,
  getTransactionType,
  TrType,
} from '../entities/transactions'

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
  const names = buildDebtorNames(input)

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
    debtor.name = names[debtor.id] ?? debtor.name

    const [{ amount, instrument }] = getTransactionMoney(
      transaction,
      input.debtAccountId
    )
    const fxCode = input.instruments[instrument].shortTitle
    debtor.balance[fxCode] = round(
      (debtor.balance[fxCode] ?? 0) +
        (transactionType === TrType.IncomeDebt ? -amount : amount)
    )
  })

  return debtors
}

function getTransactionDebtor(
  transaction: TTransaction,
  merchants: ById<TMerchant>,
  debtors: ById<TDebtor>
): TDebtor | undefined {
  if (transaction.merchant) {
    const merchant = merchants[transaction.merchant]
    const id = getDebtorId(transaction, merchants)
    const debtor = (debtors[id] ??= makeDebtorFromMerchant(merchant))
    debtor.merchantId = merchant.id
    debtor.merchantName = merchant.title
    debtor.transactions.push(transaction)
    return debtor
  }

  if (!transaction.payee) return undefined

  const id = getDebtorId(transaction, merchants)
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

/** The same name identity joins canonical merchants and legacy payees. */
export function getDebtorId(
  transaction: TTransaction,
  merchants: Record<string, Pick<TMerchant, 'title'>>
): string {
  const merchantTitle = transaction.merchant
    ? merchants[transaction.merchant]?.title
    : undefined
  return normalizePayee(merchantTitle || transaction.payee || '')
}

/** Merchant names take priority; equal-priority aliases use a stable lexical order. */
export function buildDebtorNames({
  transactions,
  merchants,
  debtAccountId,
}: Pick<
  TBuildDebtorsInput,
  'transactions' | 'merchants' | 'debtAccountId'
>): Record<string, string> {
  const merchantNames: Record<string, string> = {}
  const payeeNames: Record<string, string> = {}
  for (const transaction of transactions) {
    const type = getTransactionType(transaction, debtAccountId)
    if (type !== TrType.IncomeDebt && type !== TrType.OutcomeDebt) continue
    const id = getDebtorId(transaction, merchants)
    if (!id) continue
    const merchantName = transaction.merchant
      ? merchants[transaction.merchant]?.title
      : undefined
    const name = merchantName || transaction.payee || id
    const names = merchantName ? merchantNames : payeeNames
    if (!names[id] || name < names[id]) names[id] = name
  }
  return { ...payeeNames, ...merchantNames }
}
