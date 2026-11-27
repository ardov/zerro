import type { useTranslation } from 'react-i18next'
import { deepEqual } from '@/6-shared/helpers/deepEqual'
import { searchQueries } from '@/zerro-core/search'
import {
  merchantMatchPriority,
  merchantSearchQueries,
} from '@/3-widgets/merchant/merchantSearch'
import { core } from '@/zerro-core/redux'
import {
  filterKinds,
  getKindLabel,
  isEditableKind,
  makeDefaultClause,
  upsertFilter,
  type AddableFilterKind,
  type EditableFilterKind,
  type Clause,
} from './filterModel'

export type FilterState = {
  query: core.transactions.TTransactionQuery
  search: string
}

export type SuggestionAction =
  | { type: 'search'; text: string }
  | { type: 'edit'; kind: EditableFilterKind }
  | { type: 'apply'; clause: Clause }

export type FilterSuggestion = {
  id: string
  label: string
  kindLabel?: string
  kind: AddableFilterKind | 'search'
  action: SuggestionAction
}

type ValueClause = Extract<
  Clause,
  { kind: 'tag' | 'account' | 'merchant' | 'debtor' | 'type' }
>
export type SuggestionValue = {
  id: string
  title: string
  clause: ValueClause
  alternative?: string
  usage?: Parameters<typeof merchantMatchPriority>[1]
}

function rankName(name: string, queries: readonly string[]): number {
  const normalized = name.toLocaleLowerCase().replaceAll('ё', 'е')
  if (queries.includes(normalized)) return 0
  if (queries.some(query => normalized.startsWith(query))) return 1
  if (queries.some(query => normalized.includes(query))) return 2
  return Infinity
}

export function buildFilterSuggestions(
  input: string,
  values: readonly SuggestionValue[],
  t: ReturnType<typeof useTranslation>['t'],
  language: string
): FilterSuggestion[] {
  const text = input.trim()
  const queries = searchQueries(text).map(query => query.replaceAll('ё', 'е'))
  const suggestions: FilterSuggestion[] = []
  if (text)
    suggestions.push({
      id: 'search',
      kind: 'search',
      label: t('searchFor', { text }),
      action: { type: 'search', text },
    })

  const matchingKinds: FilterSuggestion[] = []
  for (const kind of filterKinds) {
    const title = getKindLabel(kind, t)
    if (text && !Number.isFinite(rankName(title, queries))) continue
    const editable = isEditableKind(kind)
    matchingKinds.push({
      id: 'kind:' + kind,
      kind,
      label: title,
      action: editable
        ? { type: 'edit', kind }
        : { type: 'apply', clause: makeDefaultClause(kind) },
    })
  }
  if (!text) return matchingKinds

  const amount = /^\d+(?:[.,]\d+)?$/.test(text)
    ? Number(text.replace(',', '.'))
    : NaN
  if (Number.isFinite(amount))
    suggestions.push({
      id: 'amount:' + amount,
      kind: 'amount',
      label: new Intl.NumberFormat(language, {
        maximumFractionDigits: 20,
      }).format(amount),
      kindLabel: getKindLabel('amount', t),
      action: {
        type: 'apply',
        clause: { kind: 'amount', gte: amount, lte: amount },
      },
    })

  const merchantQueries = merchantSearchQueries(text)
  const matches: Array<{ value: SuggestionValue; rank: number }> = []
  for (const value of values) {
    let rank = rankName(value.title, queries)
    if (
      !Number.isFinite(rank) &&
      value.alternative &&
      Number.isFinite(rankName(value.alternative, queries))
    )
      rank = 3
    if (
      !Number.isFinite(rank) &&
      value.clause.kind === 'merchant' &&
      merchantQueries.length
    ) {
      rank =
        3 +
        merchantMatchPriority(
          core.merchants.normalizePayee(value.title),
          value.usage,
          merchantQueries
        )
    }
    if (Number.isFinite(rank)) matches.push({ value, rank })
  }
  matches.sort(
    (a, b) =>
      a.rank - b.rank || a.value.title.localeCompare(b.value.title, language)
  )
  for (const { value } of matches) {
    const kind = value.clause.kind
    suggestions.push({
      id: 'value:' + kind + ':' + value.id,
      kind,
      label: value.title,
      kindLabel: getKindLabel(kind, t),
      action: { type: 'apply', clause: value.clause },
    })
  }
  return suggestions.concat(matchingKinds)
}

function mergeClause(previous: Clause | undefined, next: Clause): Clause {
  if (previous?.kind === 'merchant' && next.kind === 'merchant') {
    return { ...next, ids: [...new Set([...previous.ids, ...next.ids])] }
  }
  if (
    (previous?.kind === 'tag' ||
      previous?.kind === 'account' ||
      previous?.kind === 'debtor') &&
    next.kind === previous.kind
  ) {
    return { ...next, ids: [...new Set([...previous.ids, ...next.ids])] }
  }
  if (previous?.kind === 'type' && next.kind === 'type') {
    return {
      ...next,
      values: [...new Set([...previous.values, ...next.values])],
    }
  }
  if (previous?.kind === 'amount' && next.kind === 'amount')
    return { ...previous, ...next }
  return next
}

/** The highlighted row previews exactly what activating that row commits. */
export function nextFilterState(
  base: FilterState,
  action: SuggestionAction,
  mode: 'append' | 'replace' = 'append'
): FilterState {
  switch (action.type) {
    case 'edit':
      return base
    case 'search': {
      const text = action.text.trim()
      const search =
        mode === 'append'
          ? [base.search.trim(), text].filter(Boolean).join(' ')
          : text
      return search === base.search ? base : { ...base, search }
    }
    case 'apply': {
      const previous = base.query.clauses.find(
        clause => clause.kind === action.clause.kind
      )
      const merged = mergeClause(previous, action.clause)
      if (deepEqual(previous, merged)) return base
      return { ...base, query: upsertFilter(base.query, merged) }
    }
  }
}
