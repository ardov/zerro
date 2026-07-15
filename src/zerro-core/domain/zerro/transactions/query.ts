import type { ById } from '../../shared/types'
import type { TAccountId } from '../../zenmoney/accounts/types'
import type { TISODate, TISOMonth } from '../../zenmoney/primitives'
import type { TTagId } from '../../zenmoney/tags/types'
import {
  getTransactionType,
  isDeletedTransaction,
  isTransactionViewed,
  TrType,
} from '../../zenmoney/transactions'
import type { TTransaction } from '../../zenmoney/transactions/types'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvelope } from '../envelopes'
import {
  routeTransactionToActivity,
  type TTransactionActivityRoutingContext,
} from '../activity/transactionRouting'

export enum TrFilterMode {
  GeneralIncome = 'generalIncome',
  Envelope = 'envelope',
  Income = 'income',
  Outcome = 'outcome',
  All = 'all',
  TransferFees = 'transferFees',
}

export const TrFilterType = {
  Income: TrType.Income,
  Outcome: TrType.Outcome,
  Transfer: TrType.Transfer,
  Debt: 'debt',
} as const

export type TrFilterType = (typeof TrFilterType)[keyof typeof TrFilterType]

export type TTransactionFilterClause =
  | { kind: 'search'; value: string }
  | { kind: 'account'; ids: TAccountId[] }
  | { kind: 'tag'; ids: Array<TTagId | 'null'> }
  | { kind: 'type'; values: TrFilterType[] }
  | { kind: 'amount'; gte?: number; lte?: number }
  | { kind: 'date'; from?: TISODate; to?: TISODate }
  | { kind: 'viewed'; value: boolean }
  | { kind: 'deleted'; mode: 'hide' | 'include' | 'only' }
  | {
      kind: 'activity'
      envelopeIds: TEnvelopeId[]
      scope: 'self' | 'tree'
      mode: TrFilterMode
      month?: TISOMonth
    }

export type TTransactionQuery = {
  clauses: TTransactionFilterClause[]
}

export type TTransactionQueryContext = {
  routing: TTransactionActivityRoutingContext
  envelopes: ById<Pick<TEnvelope, 'id' | 'children'>>
  keepingEnvelopeIds: ReadonlySet<TEnvelopeId>
}

type TTransactionPredicate = (transaction: TTransaction) => boolean

export function compileTransactionQuery(
  query: TTransactionQuery,
  context?: TTransactionQueryContext
): TTransactionPredicate {
  const deletedClause = query.clauses.find(clause => clause.kind === 'deleted')
  const predicates = query.clauses.map(clause => compileClause(clause, context))

  return transaction => {
    if (!deletedClause && isDeletedTransaction(transaction)) return false
    return predicates.every(predicate => predicate(transaction))
  }
}

function compileClause(
  clause: TTransactionFilterClause,
  context?: TTransactionQueryContext
): TTransactionPredicate {
  switch (clause.kind) {
    case 'search': {
      const search = clause.value.trim().toUpperCase()
      return transaction =>
        !search ||
        Boolean(
          transaction.comment?.toUpperCase().includes(search) ||
          transaction.payee?.toUpperCase().includes(search)
        )
    }
    case 'account': {
      const ids = new Set(clause.ids)
      return transaction =>
        !ids.size ||
        ids.has(transaction.incomeAccount) ||
        ids.has(transaction.outcomeAccount)
    }
    case 'tag': {
      const ids = new Set(clause.ids)
      return transaction => {
        if (!ids.size) return true
        const type = getTransactionType(
          transaction,
          context?.routing.debtAccountId
        )
        if (type !== TrType.Income && type !== TrType.Outcome) return false
        if (ids.has('null') && !transaction.tag?.length) return true
        return transaction.tag?.some(id => ids.has(id)) ?? false
      }
    }
    case 'type': {
      const values = new Set(clause.values)
      return transaction => {
        if (!values.size) return true

        const type = getTransactionType(
          transaction,
          context?.routing.debtAccountId
        )
        if (type === TrType.IncomeDebt || type === TrType.OutcomeDebt) {
          return values.has(TrFilterType.Debt)
        }
        return values.has(type)
      }
    }
    case 'amount':
      return transaction => {
        const type = getTransactionType(
          transaction,
          context?.routing.debtAccountId
        )
        const values =
          type === TrType.Income || type === TrType.IncomeDebt
            ? [transaction.income]
            : type === TrType.Outcome || type === TrType.OutcomeDebt
              ? [transaction.outcome]
              : [transaction.income, transaction.outcome]
        return values.some(value => {
          if (clause.gte !== undefined && value < clause.gte) return false
          if (clause.lte !== undefined && value > clause.lte) return false
          return true
        })
      }
    case 'date':
      return transaction => {
        if (clause.from && transaction.date < clause.from) return false
        if (clause.to && transaction.date > clause.to) return false
        return true
      }
    case 'viewed':
      return transaction => isTransactionViewed(transaction) === clause.value
    case 'deleted':
      if (clause.mode === 'include') return () => true
      if (clause.mode === 'only') return isDeletedTransaction
      return transaction => !isDeletedTransaction(transaction)
    case 'activity':
      return compileActivityClause(clause, context)
  }
}

function compileActivityClause(
  clause: Extract<TTransactionFilterClause, { kind: 'activity' }>,
  context?: TTransactionQueryContext
): TTransactionPredicate {
  if (!context) {
    throw new Error('Activity transaction filters require query context')
  }

  const envelopeIds = new Set<TEnvelopeId>()
  clause.envelopeIds.forEach(id => {
    envelopeIds.add(id)
    if (clause.scope === 'tree') {
      context.envelopes[id]?.children.forEach(childId =>
        envelopeIds.add(childId)
      )
    }
  })

  return transaction => {
    const route = routeTransactionToActivity(transaction, context.routing)
    if (!route) return false
    if (clause.month && route.month !== clause.month) return false
    if (clause.mode === TrFilterMode.TransferFees) {
      return route.direction === 'internal'
    }
    if (route.direction === 'internal') return false
    if (!envelopeIds.has(route.envelopeId)) return false

    switch (clause.mode) {
      case TrFilterMode.Income:
        return route.direction === 'income'
      case TrFilterMode.Outcome:
        return route.direction === 'outcome'
      case TrFilterMode.All:
        return true
      case TrFilterMode.GeneralIncome:
        return (
          route.direction === 'income' &&
          !context.keepingEnvelopeIds.has(route.envelopeId)
        )
      case TrFilterMode.Envelope:
        return (
          route.direction === 'outcome' ||
          (route.direction === 'income' &&
            context.keepingEnvelopeIds.has(route.envelopeId))
        )
    }
  }
}
