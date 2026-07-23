import { describe, expect, it } from 'vitest'
import type { TTransactionsPageView } from './view'
import reducer, { patchTransactionsPage, resetViews } from './view'

const initialView: TTransactionsPageView = {
  query: { clauses: [] },
  search: '',
  topDate: null,
}

describe('view reducer', () => {
  it('starts with the default transactions-page view', () => {
    expect(reducer(undefined, { type: 'unknown' }).transactionsPage).toEqual(
      initialView
    )
  })

  it('patches one transactions-page property without replacing the rest', () => {
    const state = reducer(
      undefined,
      patchTransactionsPage({ search: 'coffee' })
    )

    expect(state.transactionsPage).toEqual({
      ...initialView,
      search: 'coffee',
    })
  })

  it('resets the transactions-page view to its defaults', () => {
    const changed = reducer(
      undefined,
      patchTransactionsPage({
        query: { clauses: [{ kind: 'search', value: 'coffee' }] },
        search: 'coffee',
        topDate: '2026-07-23',
      })
    )

    expect(reducer(changed, resetViews()).transactionsPage).toEqual(initialView)
  })
})
