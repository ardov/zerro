import { expect, test } from 'vitest'
import { i18n } from '@/6-shared/localization'
import {
  buildFilterSuggestions,
  nextFilterState,
  type FilterState,
  type SuggestionValue,
  type SuggestionAction,
} from './filterSuggestions'

const t = i18n.getFixedT('ru', 'filterDrawer')
const values: SuggestionValue[] = [
  { id: '1', title: 'Самиздат', clause: { kind: 'tag', ids: ['1'] } },
  { id: '1', title: 'Датский', clause: { kind: 'account', ids: ['1'] } },
  { id: '1', title: 'ДАТ', clause: { kind: 'merchant', ids: ['1'] } },
  {
    id: '2',
    title: 'Другое',
    clause: { kind: 'merchant', ids: ['2'] },
    usage: { searchTerms: { payee: ['дат 001'], originalPayee: [] } },
  },
]
const rows = (text: string) => buildFilterSuggestions(text, values, t, 'ru')
const base: FilterState = {
  query: { clauses: [{ kind: 'tag', ids: ['books'] }] },
  search: 'кофе',
}

test('offers editors and flags on opening, then text, ranked values and matching kinds across dictionaries', () => {
  const empty = rows('')
  expect(empty.find(row => row.kind === 'date')?.action).toEqual({
    type: 'edit',
    kind: 'date',
  })
  expect(empty.some(row => row.kindLabel || row.kind === 'search')).toBe(false)
  expect(empty.find(row => row.kind === 'viewed')?.action).toEqual({
    type: 'apply',
    clause: { kind: 'viewed', value: false },
  })
  const labels = rows('дат').map(row => row.label)
  expect(labels).toEqual([
    'Поиск «дат»',
    'ДАТ',
    'Датский',
    'Самиздат',
    'Другое',
    'Дата',
  ])
  expect(rows('дат').find(row => row.kind === 'tag')).toMatchObject({
    label: 'Самиздат',
    kindLabel: 'Категория',
  })
  expect(
    rows('lfn')
      .slice(1)
      .map(row => row.label)
  ).toEqual(labels.slice(1))
  expect(rows('счет').map(row => row.action)).toContainEqual({
    type: 'edit',
    kind: 'account',
  })
})

test('preview uses the committed query for editor rows and unions value rows without duplicating IDs', () => {
  expect(nextFilterState(base, { type: 'edit', kind: 'date' })).toBe(base)
  const category = {
    type: 'apply',
    clause: { kind: 'tag', ids: ['1'] },
  } satisfies SuggestionAction
  const preview = nextFilterState(base, category)
  expect(preview).toEqual({
    search: 'кофе',
    query: { clauses: [{ kind: 'tag', ids: ['books', '1'] }] },
  })
  expect(nextFilterState(preview, category)).toBe(preview)
  expect(base.query.clauses).toEqual([{ kind: 'tag', ids: ['books'] }])
})

test('adding text extends the one saved text chip and editing it replaces the text', () => {
  expect(
    nextFilterState(base, { type: 'search', text: base.search }, 'replace')
  ).toBe(base)
  const action = rows(' утро ')[0].action
  expect(nextFilterState(base, action)).toEqual({
    ...base,
    search: 'кофе утро',
  })
  expect(nextFilterState(base, action, 'replace')).toEqual({
    ...base,
    search: 'утро',
  })
})

test('offers decimal input as text or an exact amount and keeps the selected currency', () => {
  const [searchRow, amountRow] = rows('123,45')
  expect(searchRow.action).toEqual({ type: 'search', text: '123,45' })
  const limited = {
    search: '',
    query: {
      clauses: [{ kind: 'amount' as const, gte: 45, currencies: ['CZK'] }],
    },
  }
  expect(nextFilterState(limited, amountRow.action).query.clauses).toEqual([
    { kind: 'amount', gte: 123.45, lte: 123.45, currencies: ['CZK'] },
  ])
})
