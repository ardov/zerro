import type { TTagId } from '6-shared/types'
import { describe, expect, test } from 'vitest'
import { store } from 'store'
import { applyClientPatch } from 'store/data'
import { makeTransaction } from './makeTransaction'
import { getTransactionsById } from './model'
import { bulkEditTransactions } from './thunks'

function makeTr(id: string, tag: TTagId[] | null) {
  return makeTransaction({
    id,
    user: 0,
    date: '2024-01-01',
    incomeInstrument: 2,
    incomeAccount: 'acc',
    outcomeInstrument: 2,
    outcomeAccount: 'acc',
    outcome: 100,
    tag,
  })
}

describe('bulkEditTransactions', () => {
  test('adds a tag keeping own tags of every transaction', () => {
    store.dispatch(
      applyClientPatch({
        transaction: [makeTr('tr1', ['tag1']), makeTr('tr2', ['tag2'])],
      })
    )
    store.dispatch(
      bulkEditTransactions(['tr1', 'tr2'], { tags: ['mixed', 'tag3'] })
    )
    const transactions = getTransactionsById(store.getState())
    expect(transactions.tr1.tag).toEqual(['tag1', 'tag3'])
    expect(transactions.tr2.tag).toEqual(['tag2', 'tag3'])
  })

  test('never writes the "mixed" placeholder to a transaction without tags', () => {
    store.dispatch(
      applyClientPatch({
        transaction: [makeTr('tr3', ['tag1']), makeTr('tr4', null)],
      })
    )
    store.dispatch(
      bulkEditTransactions(['tr3', 'tr4'], { tags: ['mixed', 'tag3'] })
    )
    const transactions = getTransactionsById(store.getState())
    expect(transactions.tr3.tag).toEqual(['tag1', 'tag3'])
    expect(transactions.tr4.tag).toEqual(['tag3'])
  })
})
