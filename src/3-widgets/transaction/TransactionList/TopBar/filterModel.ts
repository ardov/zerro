import type { useTranslation } from 'react-i18next'
import { getDateFilterLabel } from './dateFilterLabel'
import { core } from '@/zerro-core/redux'

export type Clause = core.transactions.TTransactionFilterClause
export type AddableFilterKind = Exclude<Clause['kind'], 'search' | 'activity'>
export type SelectKind = 'tag' | 'account' | 'type' | 'merchant'
export type EditableFilterKind = SelectKind | 'amount' | 'date' | 'changed'
export type AmountClause = Extract<Clause, { kind: 'amount' }>
export type DateClause = Extract<Clause, { kind: 'date' }>

export const filterKinds: AddableFilterKind[] = [
  'account',
  'tag',
  'merchant',
  'type',
  'amount',
  'date',
  'changed',
  'viewed',
  'deleted',
]

/** Replace in place so an edit never reorders chips. */
export function upsertFilter(
  query: core.transactions.TTransactionQuery,
  clause: Clause
): core.transactions.TTransactionQuery {
  const exists = query.clauses.some(item => item.kind === clause.kind)
  return {
    clauses: exists
      ? query.clauses.map(item => (item.kind === clause.kind ? clause : item))
      : [...query.clauses, clause],
  }
}

export function makeDefaultClause(kind: AddableFilterKind): Clause {
  switch (kind) {
    case 'account':
      return { kind, ids: [] }
    case 'tag':
    case 'merchant':
      return { kind, ids: [] }
    case 'type':
      return { kind, values: [] }
    case 'amount':
    case 'date':
    case 'changed':
      return { kind }
    case 'viewed':
      return { kind, value: false }
    case 'deleted':
      return { kind, mode: 'include' }
  }
}

export function isSelectKind(kind: Clause['kind']): kind is SelectKind {
  return (
    kind === 'tag' ||
    kind === 'account' ||
    kind === 'type' ||
    kind === 'merchant'
  )
}

export function isEditableKind(
  kind: Clause['kind']
): kind is EditableFilterKind {
  return (
    isSelectKind(kind) ||
    kind === 'amount' ||
    kind === 'date' ||
    kind === 'changed'
  )
}

export function isEmptyClause(clause: Clause): boolean {
  if (
    clause.kind === 'account' ||
    clause.kind === 'tag' ||
    clause.kind === 'merchant'
  )
    return !clause.ids.length
  if (clause.kind === 'type') return !clause.values.length
  if (clause.kind === 'amount') {
    return clause.gte === undefined && clause.lte === undefined
  }
  if (clause.kind === 'changed') return !clause.period
  if (clause.kind === 'date') return !clause.from && !clause.to
  return false
}

export function getClauseLabel(
  clause: Clause,
  context: {
    accounts: ReturnType<typeof core.accounts.usePopulated>
    envelopes: ReturnType<typeof core.envelopes.selectAll>
    merchants: ReturnType<typeof core.merchants.useAll>
    tags: ReturnType<typeof core.tags.selectPopulated>
    t: ReturnType<typeof useTranslation>['t']
    language: string
    today: number
  }
): string {
  const { accounts, envelopes, tags, merchants, t, language, today } = context
  switch (clause.kind) {
    case 'account':
      return clause.ids.length
        ? joinLabels(clause.ids, id => accounts[id]?.title || id)
        : t('account')
    case 'merchant':
      return clause.ids.length
        ? joinLabels(clause.ids, id =>
            id === null ? t('noMerchant') : merchants[id]?.title || id
          )
        : t('merchant')
    case 'activity':
      if (clause.mode === core.transactions.TrFilterMode.TransferFees) {
        return t('transferFees')
      }
      return joinLabels(clause.envelopeIds, id => envelopes[id]?.name || id)
    case 'tag':
      return clause.ids.length
        ? joinLabels(clause.ids, id => tags[id]?.name || id)
        : t('category')
    case 'type':
      return clause.values.length
        ? clause.values.map(value => getTypeLabel(value, t)).join(', ')
        : t('transactionType')
    case 'amount':
      return getAmountLabel(clause, t, language)
    case 'changed':
      return clause.period
        ? getChangedPeriodLabel(clause.period, t, true)
        : t('lastChanged')
    case 'date':
      return getDateFilterLabel(clause, t, language, new Date(today))
    case 'viewed':
      return clause.value ? t('viewed') : t('onlyNew')
    case 'deleted':
      return clause.mode === 'only' ? t('onlyDeleted') : t('showDeleted')
    case 'search':
      return clause.value
  }
}

export function getAmountLabel(
  clause: AmountClause,
  t: ReturnType<typeof useTranslation>['t'],
  language: string
): string {
  const format = (value: number) =>
    new Intl.NumberFormat(language).format(value)

  if (clause.gte !== undefined && clause.lte !== undefined) {
    if (clause.gte === clause.lte)
      return `${t('amount')}: ${format(clause.gte)}`
    return `${t('amount')}: ${format(clause.gte)}–${format(clause.lte)}`
  }
  if (clause.gte !== undefined)
    return `${t('amountFrom')} ${format(clause.gte)}`
  if (clause.lte !== undefined) return `${t('amountTo')} ${format(clause.lte)}`
  return t('amount')
}

export function getKindLabel(
  kind: AddableFilterKind,
  t: ReturnType<typeof useTranslation>['t']
) {
  switch (kind) {
    case 'changed':
      return t('lastChanged')
    case 'date':
      return t('date')
    case 'merchant':
      return t('merchant')
    case 'account':
      return t('account')
    case 'tag':
      return t('category')
    case 'type':
      return t('transactionType')
    case 'amount':
      return t('amount')
    case 'viewed':
      return t('onlyNew')
    case 'deleted':
      return t('showDeleted')
  }
}

export function getTypeLabel(
  type: core.transactions.TrFilterType,
  t: ReturnType<typeof useTranslation>['t']
) {
  switch (type) {
    case core.transactions.TrFilterType.Income:
      return t('transactionType_income')
    case core.transactions.TrFilterType.Outcome:
      return t('transactionType_outcome')
    case core.transactions.TrFilterType.Transfer:
      return t('transactionType_transfer')
    case core.transactions.TrFilterType.Debt:
      return t('transactionType_debt')
  }
}

export function joinLabels<T>(
  values: T[],
  getLabel: (value: T) => string
): string {
  const labels = values.map(getLabel)
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
}

export function getChangedPeriodLabel(
  period: core.transactions.TChangedPeriod,
  t: ReturnType<typeof useTranslation>['t'],
  modified = false
) {
  if (period === 'today') return t(modified ? 'modifiedToday' : 'common:today')
  if (period === 'yesterday')
    return t(modified ? 'modifiedYesterday' : 'common:yesterday')
  const preset = core.transactions.changedPeriods.find(
    item => item.value === period
  )!
  return t(modified ? 'modifiedLastDays' : 'lastDays', {
    count: preset.before - preset.from,
  })
}
