import { operationPatch } from '@/zerro-core/support/testing/commandTestData'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { undoClientCommand } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import {
  makeAccount,
  makeMerchant,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import {
  applyChangesToTransaction,
  bulkEditTransactions,
  createPosting,
  setAccountInBalance,
  setTransactionsViewed,
} from './commands'

const NOW = Date.parse('2026-07-29T12:00:00Z')
const UUID = 'redux-created-transaction'

vi.mock('uuid', () => ({ v1: () => UUID }))

afterEach(() => vi.restoreAllMocks())

function makeStoreWithState(preloadedState: RootState) {
  return configureStore({ reducer: rootReducer, preloadedState })
}

describe('Redux semantic commands', () => {
  it('creates a transaction through the public wrapper and returns its id', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const current = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        cash: makeAccount({ id: 'cash', instrument: 1 }),
      },
    })
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(current),
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })

    const transactionId = store.dispatch(
      createPosting({
        kind: 'expense',
        accountId: 'cash',
        amount: 12.5,
        date: '2026-07-29',
        comment: 'Lunch',
      })
    )

    expect(transactionId).toBe(UUID)
    expect(store.getState().data.outbox).toHaveLength(1)
    expect(
      operationPatch(store.getState().data.outbox[0]).transaction?.[0]
    ).toMatchObject({
      id: UUID,
      date: '2026-07-29',
      outcome: 12.5,
      incomeAccount: 'cash',
      outcomeAccount: 'cash',
      comment: 'Lunch',
    })
    expect(store.getState().data.current.transaction[UUID]).toMatchObject({
      id: UUID,
      user: 1,
      changed: NOW,
      created: NOW,
      income: 0,
      outcome: 12.5,
      incomeAccount: 'cash',
      outcomeAccount: 'cash',
      incomeInstrument: 1,
      outcomeInstrument: 1,
      comment: 'Lunch',
      viewed: true,
    })
  })

  it('creates a merchant and transaction together and undoes both', () => {
    const current = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: { cash: makeAccount({ id: 'cash', instrument: 1 }) },
    })
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(current),
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })
    const id = store.dispatch(
      createPosting({
        kind: 'expense',
        accountId: 'cash',
        amount: 25,
        date: '2026-07-29',
        payee: 'New shop',
        merchant: { title: 'New shop' },
      })
    )
    const state = store.getState().data
    expect(state.outbox).toHaveLength(1)
    const merchantId = state.current.transaction[id].merchant!
    expect(state.current.merchant[merchantId].title).toBe('New shop')
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.transaction[id]).toBeUndefined()
    expect(store.getState().data.current.merchant[merchantId]).toBeUndefined()
  })

  it('includes a cash account in the balance as an undoable change', () => {
    const account = makeAccount({ id: 'cash', inBalance: false })
    const store = makeStoreWithState(
      makeTestRootState(makeStore({ account: { cash: account } }))
    )
    store.dispatch(setAccountInBalance('cash', true))

    expect(store.getState().data.current.account.cash.inBalance).toBe(true)
    expect(operationPatch(store.getState().data.outbox[0])).toEqual({
      account: [{ id: 'cash', inBalance: true }],
    })

    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.account.cash).toEqual(account)
  })

  it.each([
    {
      source: 'outbox',
      recovery: { outboxRecoveryReason: 'outbox[0] is invalid' },
    },
    {
      source: 'journal',
      recovery: {
        journalRecoveryRequired: true,
        journalRecoveryReason: 'broken checkpoint',
      },
    },
  ])(
    'blocks account changes while the $source awaits recovery',
    ({ recovery }) => {
      const account = makeAccount({ id: 'cash', inBalance: false })
      const state = makeTestRootState(makeStore({ account: { cash: account } }))
      state.data = { ...state.data, ...recovery }
      const store = makeStoreWithState(state)

      store.dispatch(setAccountInBalance('cash', true))

      expect(store.getState().data.current.account.cash).toEqual(account)
      expect(store.getState().data.outbox).toEqual([])
    }
  )

  describe.each(['Edited', 'Edited $&'])(
    'bulk categories with comment %s',
    comment => {
      it.each([
        { tags: ['a', 'null', 'b', 'a', 'b'], expected: ['a', 'b'] },
        { tags: [], expected: [] },
        { tags: undefined, expected: ['original'] },
      ])(
        'normalizes $tags without changing omission semantics',
        ({ tags, expected }) => {
          const store = configureStore({
            reducer: rootReducer,
            preloadedState: makeTestRootState(
              makeStore({
                transaction: {
                  tr: makeTransaction({
                    id: 'tr',
                    tag: ['original'],
                    comment: 'Lunch',
                  }),
                },
              })
            ),
            middleware: getDefaultMiddleware =>
              getDefaultMiddleware({
                immutableCheck: false,
                serializableCheck: false,
              }),
          })
          store.dispatch(bulkEditTransactions(['tr'], { tags, comment }))
          expect(store.getState().data.current.transaction.tr.tag).toEqual(
            expected
          )
        }
      )
    }
  )

  it.each([undefined, {}])(
    'clears a bulk comment and supports undo with tagsById %s',
    tagsById => {
      const store = configureStore({
        reducer: rootReducer,
        preloadedState: makeTestRootState(
          makeStore({
            transaction: {
              first: makeTransaction({ id: 'first', comment: 'Lunch' }),
              second: makeTransaction({ id: 'second', comment: 'Dinner' }),
            },
          })
        ),
        middleware: getDefaultMiddleware =>
          getDefaultMiddleware({
            immutableCheck: false,
            serializableCheck: false,
          }),
      })
      store.dispatch(
        bulkEditTransactions(
          ['first', 'second'],
          tagsById ? { tagsById, comment: '' } : { comment: '' }
        )
      )
      expect(store.getState().data.current.transaction.first.comment).toBe('')
      expect(store.getState().data.current.transaction.second.comment).toBe('')
      store.dispatch(undoClientCommand())
      expect(store.getState().data.current.transaction.first.comment).toBe(
        'Lunch'
      )
      expect(store.getState().data.current.transaction.second.comment).toBe(
        'Dinner'
      )
    }
  )

  it.each([
    undefined,
    null,
    { id: 'shop', title: 'Shop' },
    { title: 'New shop' },
  ])('applies bulk merchant intent %j as one undoable command', merchant => {
    const first = makeTransaction({
      id: 'first',
      payee: 'Legacy',
      originalPayee: 'Bank text',
    })
    const second = makeTransaction({
      id: 'second',
      merchant: 'old',
      payee: 'Old',
    })
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({
          user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
          merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
          transaction: { first, second },
        })
      ),
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })
    store.dispatch(
      bulkEditTransactions(['first', 'second'], { merchant, comment: 'Shared' })
    )
    const data = store.getState().data.current
    for (const original of [first, second]) {
      expect(data.transaction[original.id]).toMatchObject({
        merchant:
          merchant === undefined
            ? original.merchant
            : (merchant?.id ?? (merchant ? UUID : null)),
        payee:
          merchant === undefined ? original.payee : (merchant?.title ?? null),
        originalPayee: original.originalPayee,
        comment: 'Shared',
      })
    }
    if (merchant && !merchant.id)
      expect(data.merchant[UUID].title).toBe('New shop')
    expect(store.getState().data.outbox).toHaveLength(1)
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.transaction.first).toMatchObject(first)
    expect(store.getState().data.current.transaction.second).toMatchObject(
      second
    )
    expect(store.getState().data.current.merchant[UUID]).toBeUndefined()
  })

  it('saves individual category drafts as one undoable bulk command', () => {
    const current = makeStore({
      transaction: {
        first: makeTransaction({ id: 'first', tag: ['food', 'trip'] }),
        second: makeTransaction({ id: 'second', tag: ['food', 'work'] }),
      },
    })
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(current),
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })
    store.dispatch(
      bulkEditTransactions(['first', 'second'], {
        tagsById: { first: ['cafe', 'trip'], second: ['cafe', 'work'] },
      })
    )
    expect(store.getState().data.current.transaction.first.tag).toEqual([
      'cafe',
      'trip',
    ])
    expect(store.getState().data.current.transaction.second.tag).toEqual([
      'cafe',
      'work',
    ])
    expect(store.getState().data.outbox).toHaveLength(1)
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.transaction.first.tag).toEqual([
      'food',
      'trip',
    ])
    expect(store.getState().data.current.transaction.second.tag).toEqual([
      'food',
      'work',
    ])
  })

  it('marks the selected transactions viewed without changing other fields', () => {
    const first = makeTransaction({ id: 'first', outcome: 10, viewed: false })
    const second = makeTransaction({ id: 'second', outcome: 10, viewed: false })
    const third = makeTransaction({ id: 'third', outcome: 10, viewed: false })
    const store = makeStoreWithState(
      makeTestRootState(makeStore({ transaction: { first, second, third } }))
    )
    const getTransactions = () => store.getState().data.current.transaction

    store.dispatch(setTransactionsViewed(['first', 'second'], true))

    expect(getTransactions().first).toMatchObject({ viewed: true, outcome: 10 })
    expect(getTransactions().second).toMatchObject({
      viewed: true,
      outcome: 10,
    })
    expect(getTransactions().third).toBe(third)

    store.dispatch(undoClientCommand())
    expect(getTransactions()).toEqual({ first, second, third })
  })

  it('creates or reuses a named merchant when editing a transaction', () => {
    const store = makeStoreWithState(
      makeTestRootState(
        makeStore({
          user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
          transaction: { first: makeTransaction({ id: 'first', outcome: 10 }) },
          merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
        })
      )
    )
    const getCurrent = () => store.getState().data.current

    store.dispatch(
      applyChangesToTransaction({ id: 'first', payee: 'Kiosk' }, 'Kiosk')
    )
    expect(getCurrent().merchant[UUID].title).toBe('Kiosk')
    expect(getCurrent().transaction.first).toMatchObject({
      payee: 'Kiosk',
      merchant: UUID,
    })

    store.dispatch(
      applyChangesToTransaction({ id: 'first', payee: 'Shop' }, 'Shop')
    )
    expect(Object.keys(getCurrent().merchant).sort()).toEqual([UUID, 'shop'])
    expect(getCurrent().transaction.first).toMatchObject({
      payee: 'Shop',
      merchant: 'shop',
    })

    store.dispatch(undoClientCommand())
    expect(getCurrent().transaction.first.merchant).toBe(UUID)
    store.dispatch(undoClientCommand())
    expect(getCurrent().transaction.first.merchant).toBeNull()
    expect(getCurrent().merchant[UUID]).toBeUndefined()
  })
})
