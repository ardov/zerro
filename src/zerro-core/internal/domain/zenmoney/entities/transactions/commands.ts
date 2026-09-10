import type { ById } from '../../../foundation/types'
import type { TCompiled, TCoreContext } from '../../../../../types'
import type { TDateDraft, TMsTime } from '../../primitives'
import { getDebtAccountId, type TAccount, type TAccountId } from '../accounts'
import type { TInstrument, TInstrumentId } from '../instruments'
import {
  compileCreateMerchant,
  type TMerchant,
  type TMerchantId,
} from '../merchants'
import type { TTag, TTagId } from '../tags'
import { getRootUser, type TUser } from '../users'
import { round } from '../../../foundation/numbers'
import { getTransaction, getTransactionType, TrType } from './read'
import { makeTransaction } from './factory'
import {
  transactionIntentFields,
  type TTransaction,
  type TTransactionId,
  type TTransactionPatch,
} from './types'

export type TTransactionIntent = {
  transaction: TTransactionPatch[]
  /** Transaction commands intentionally do not change account balances. */
  account?: never
}

type TCreateDetails = {
  createdAt?: TMsTime
  date: TDateDraft
  comment?: string | null
}

export type TCreateMerchantReference = { id: TMerchantId } | { title: string }

export type TOriginalAmount = {
  amount: number
  instrumentId: TInstrumentId
}

type TCreatePostingDetails = TCreateDetails & {
  merchant?: TCreateMerchantReference | null
  payee?: string | null
  originalPayee?: string | null
  /** What the bank charged before converting into the account currency. */
  originalAmount?: TOriginalAmount | null
  qrCode?: string | null
}

type TCreateCategorizedPostingDetails = TCreatePostingDetails & {
  tagIds?: TTagId[]
}

export type TCreatePostingInput =
  | (TCreateCategorizedPostingDetails & {
      kind: 'expense'
      accountId: TAccountId
      amount: number
    })
  | (TCreateCategorizedPostingDetails & {
      kind: 'income'
      accountId: TAccountId
      amount: number
    })
  | (TCreatePostingDetails & {
      kind: 'lent' | 'borrowed'
      accountId: TAccountId
      amount: number
    })

export type TCreateTransferInput = TCreateDetails & {
  fromAccountId: TAccountId
  toAccountId: TAccountId
  sent: number
  received?: number
}

export type TCreateTransactionReceipt = {
  transactionId: TTransactionId
}

export type TCreateTransactionData = {
  user: ById<TUser>
  account: ById<TAccount>
  instrument: ById<TInstrument>
  tag: ById<TTag>
  merchant: ById<TMerchant>
}

export function compileCreatePosting(
  data: TCreateTransactionData,
  input: TCreatePostingInput,
  ctx: TCoreContext
): TCompiled<TCreateTransactionReceipt> {
  const merchant = resolveMerchant(data, input.merchant, ctx)
  const compiled = compileCreateTransaction(
    data,
    {
      mode: 'posting',
      input,
      merchantId: merchant?.receipt.merchantId ?? null,
    },
    ctx
  )
  return {
    ...compiled,
    patch: { ...compiled.patch, ...merchant?.patch },
  }
}

export function compileCreateTransfer(
  data: TCreateTransactionData,
  input: TCreateTransferInput,
  ctx: TCoreContext
): TCompiled<TCreateTransactionReceipt> {
  return compileCreateTransaction(data, { mode: 'transfer', input }, ctx)
}

type TResolvedCreateInput =
  | {
      mode: 'posting'
      input: TCreatePostingInput
      merchantId: TMerchantId | null
    }
  | { mode: 'transfer'; input: TCreateTransferInput }

function compileCreateTransaction(
  data: TCreateTransactionData,
  resolved: TResolvedCreateInput,
  ctx: TCoreContext
): TCompiled<TCreateTransactionReceipt> {
  const user = getRootUser(data.user)
  if (!user) throw new Error('Cannot create transaction without root user')

  let transaction: TTransaction
  if (resolved.mode === 'transfer') {
    const { input } = resolved
    const outcomeAccount = requireEntity(
      data.account,
      input.fromAccountId,
      'outcome account'
    )
    const incomeAccount = requireEntity(
      data.account,
      input.toAccountId,
      'income account'
    )
    if (outcomeAccount.id === incomeAccount.id) {
      throw new Error('Transfer accounts must be different')
    }

    requirePositiveAmount(input.sent, 'sent')
    const income =
      input.received ??
      (outcomeAccount.instrument === incomeAccount.instrument
        ? input.sent
        : undefined)
    if (income === undefined) {
      throw new Error('Cross-instrument transfer requires income amount')
    }
    requirePositiveAmount(income, 'income')

    const issuedAt = ctx.now()
    transaction = makeTransaction(
      {
        id: ctx.uuid() as TTransactionId,
        user: user.id,
        date: input.date,
        comment: input.comment,
        created: input.createdAt ?? issuedAt,
        changed: issuedAt,
        outcome: input.sent,
        outcomeAccount: outcomeAccount.id,
        outcomeInstrument: outcomeAccount.instrument,
        income,
        incomeAccount: incomeAccount.id,
        incomeInstrument: incomeAccount.instrument,
      },
      ctx
    )
  } else {
    const { input, merchantId } = resolved
    const account = requireEntity(data.account, input.accountId, 'account')
    requirePositiveAmount(input.amount, 'amount')
    const tagIds =
      input.kind === 'expense' || input.kind === 'income'
        ? input.tagIds
        : undefined
    tagIds?.forEach(id => requireEntity(data.tag, id, 'tag'))

    const debt = input.kind === 'lent' || input.kind === 'borrowed'
    const debtId = debt ? getDebtAccountId(data.account) : undefined
    if (debt && !debtId) throw new Error('Debt account is missing')
    if (debt && !input.payee?.trim()) {
      throw new Error('Debt requires a counterparty')
    }
    if (input.originalAmount) {
      requirePositiveAmount(input.originalAmount.amount, 'original amount')
      requireEntity(
        data.instrument,
        input.originalAmount.instrumentId,
        'instrument'
      )
    }
    const incoming = input.kind === 'income' || input.kind === 'borrowed'
    const issuedAt = ctx.now()
    transaction = makeTransaction(
      {
        id: ctx.uuid() as TTransactionId,
        user: user.id,
        date: input.date,
        comment: input.comment,
        created: input.createdAt ?? issuedAt,
        changed: issuedAt,
        income: debt || incoming ? input.amount : 0,
        outcome: debt || !incoming ? input.amount : 0,
        incomeAccount: input.kind === 'lent' ? debtId! : account.id,
        outcomeAccount: input.kind === 'borrowed' ? debtId! : account.id,
        incomeInstrument: account.instrument,
        outcomeInstrument: account.instrument,
        opIncome: incoming ? input.originalAmount?.amount : undefined,
        opIncomeInstrument: incoming
          ? input.originalAmount?.instrumentId
          : undefined,
        opOutcome: !incoming ? input.originalAmount?.amount : undefined,
        opOutcomeInstrument: !incoming
          ? input.originalAmount?.instrumentId
          : undefined,
        tag: tagIds?.length ? [...tagIds] : null,
        merchant: merchantId,
        payee: input.payee,
        originalPayee: input.originalPayee ?? input.payee,
        qrCode: input.qrCode,
      },
      ctx
    )
  }

  return {
    patch: { transaction: [toCreationPatch(transaction)] },
    receipt: { transactionId: transaction.id },
  }
}

function resolveMerchant(
  data: TCreateTransactionData,
  merchant: TCreateMerchantReference | null | undefined,
  ctx: TCoreContext
) {
  if (!merchant) return null
  if ('title' in merchant) {
    return compileCreateMerchant(data.merchant, merchant.title, ctx)
  }
  requireEntity(data.merchant, merchant.id, 'merchant')
  return { patch: {}, receipt: { merchantId: merchant.id } }
}

export function compileDeleteTransactions(
  transactions: ById<TTransaction>,
  ids: TTransactionId | TTransactionId[]
): TTransactionIntent {
  return {
    transaction: toArray(ids).map(id => ({
      id: getExistingTransaction(transactions, id).id,
      deleted: true,
    })),
  }
}

export function compileDeleteTransactionsPermanently(
  transactions: ById<TTransaction>,
  ids: TTransactionId | TTransactionId[]
): TTransactionIntent {
  return {
    transaction: toArray(ids).map(id => ({
      id: getExistingTransaction(transactions, id).id,
      outcome: 0.00001,
      income: 0.00001,
    })),
  }
}

export function compileRestoreTransaction(
  transactions: ById<TTransaction>,
  id: TTransactionId,
  ctx: TCoreContext
): TTransactionIntent {
  // Creation: the replacement id must be generated at issue time, so the full
  // source transaction is re-emitted under a fresh id.
  const { changed: _changed, ...source } = getExistingTransaction(
    transactions,
    id
  )
  return {
    transaction: [
      {
        ...source,
        deleted: false,
        id: ctx.uuid(),
      },
    ],
  }
}

export function compileBulkEditTransactions(
  transactions: ById<TTransaction>,
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string }
): TTransactionIntent {
  return {
    transaction: ids.map(id => {
      const transaction = getExistingTransaction(transactions, id)
      return {
        id,
        tag: modifyTags(transaction.tag, opts.tags),
        comment: modifyComment(transaction.comment, opts.comment),
      }
    }),
  }
}

/**
 * Combines selected income transactions into the single selected outcome:
 * the outcome amount is reduced by each income, same-account incomes are
 * deleted, and cross-account incomes become transfers into the outcome
 * account. Availability (single same-instrument outcome larger than the
 * incomes) is decided by the caller.
 */
export function compileCombineToOutcome(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  const outcome = outcomes[0]
  if (!outcome) throw new Error('No outcome transaction to combine into')

  const { outcomeInstrument, outcomeAccount } = outcome
  let outcomeSum = outcome.outcome

  const transaction: TTransactionPatch[] = incomes.map(tr => {
    outcomeSum = round(outcomeSum - tr.income)
    if (tr.incomeAccount === outcomeAccount) {
      return { id: tr.id, deleted: true }
    }
    return {
      id: tr.id,
      outcomeAccount,
      outcome: tr.income,
      outcomeInstrument,
    }
  })
  transaction.push({ id: outcome.id, outcome: outcomeSum })

  return { transaction }
}

/**
 * Mirror of {@link compileCombineToOutcome}: combines selected outcomes into
 * the single selected income.
 */
export function compileCombineToIncome(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  const income = incomes[0]
  if (!income) throw new Error('No income transaction to combine into')

  const { incomeInstrument, incomeAccount } = income
  let incomeSum = income.income

  const transaction: TTransactionPatch[] = outcomes.map(tr => {
    incomeSum = round(incomeSum - tr.outcome)
    if (tr.outcomeAccount === incomeAccount) {
      return { id: tr.id, deleted: true }
    }
    return {
      id: tr.id,
      incomeAccount,
      income: tr.outcome,
      incomeInstrument,
    }
  })
  transaction.push({ id: income.id, income: incomeSum })

  return { transaction }
}

/**
 * Merges one selected outcome and one selected income into a single transfer:
 * the income transaction gains the outcome side and the standalone outcome is
 * deleted. The caller guarantees exactly one income and one outcome.
 */
export function compileMergeTransactionsAsTransfer(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): TTransactionIntent {
  const { incomes, outcomes } = groupTransactionsByType(transactions, ids)
  if (incomes.length !== 1 || outcomes.length !== 1) {
    throw new Error('Transfer merge needs exactly one income and one outcome')
  }
  const income = incomes[0]
  const outcome = outcomes[0]

  return {
    transaction: [
      { id: outcome.id, deleted: true },
      {
        id: income.id,
        outcomeAccount: outcome.outcomeAccount,
        outcome: outcome.outcome,
        outcomeInstrument: outcome.outcomeInstrument,
      },
    ],
  }
}

function groupTransactionsByType(
  transactions: ById<TTransaction>,
  ids: TTransactionId[]
): { incomes: TTransaction[]; outcomes: TTransaction[] } {
  const incomes: TTransaction[] = []
  const outcomes: TTransaction[] = []

  ids.forEach(id => {
    const transaction = getExistingTransaction(transactions, id)
    const type = getTransactionType(transaction)
    if (type === TrType.Income) incomes.push(transaction)
    if (type === TrType.Outcome) outcomes.push(transaction)
  })

  return { incomes, outcomes }
}

function getExistingTransaction(
  transactions: ById<TTransaction>,
  id: TTransactionId
): TTransaction {
  const transaction = getTransaction(transactions, id)
  if (!transaction) throw new Error('Transaction not found')
  return transaction
}

function modifyTags(prevTags: TTagId[] | null, newTags?: TTagId[]) {
  if (!newTags) return prevTags

  const result: TTagId[] = []
  const addId = (id: TTagId) => {
    if (!result.includes(id) && id !== 'null') result.push(id)
  }

  newTags.forEach(id => {
    if (id === 'mixed' && prevTags) prevTags.forEach(addId)
    else addId(id)
  })

  return result
}

function modifyComment(prevComment: string | null, newComment?: string) {
  if (!newComment) return prevComment
  return newComment.replaceAll('$&', prevComment || '')
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

function requirePositiveAmount(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Transaction ${field} must be a finite positive amount`)
  }
}

function requireEntity<TEntity extends { id: string | number }>(
  entities: ById<TEntity>,
  id: TEntity['id'],
  entity: string
): TEntity {
  const value = entities[id]
  if (!value) throw new Error(`Transaction ${entity} not found: ${id}`)
  return value
}

function toCreationPatch(transaction: TTransaction): TTransactionPatch {
  const patch: Record<string, unknown> = { id: transaction.id }
  transactionIntentFields.forEach(field => {
    patch[field] = transaction[field]
  })
  return patch as TTransactionPatch
}
