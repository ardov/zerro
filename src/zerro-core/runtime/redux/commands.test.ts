import { operationPatch } from '@/zerro-core/support/testing/commandTestData'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { appendClientCommand, undoClientCommand } from '@/store/data'
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

function makeDispatch(state: RootState) {
  const dispatch: any = vi.fn(action =>
    typeof action === 'function'
      ? action(dispatch, () => state, undefined)
      : action
  )
  return dispatch
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

  it('writes sparse account intent through the public wrapper', () => {
    const account = makeAccount({ id: 'cash', inBalance: false })
    const dispatch = makeDispatch(
      makeTestRootState(makeStore({ account: { cash: account } }))
    )

    dispatch(setAccountInBalance('cash', true))

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientCommand.type,
        payload: expect.objectContaining({
          operations: [
            { type: 'account.patch', value: { id: 'cash', inBalance: true } },
          ],
        }),
      })
    )
  })

  it('blocks new commands while a corrupt durable outbox is quarantined', () => {
    const account = makeAccount({ id: 'cash', inBalance: false })
    const state = makeTestRootState(makeStore({ account: { cash: account } }))
    state.data.outboxRecoveryReason = 'outbox[0] is invalid'
    const dispatch = makeDispatch(state)

    dispatch(setAccountInBalance('cash', true))

    expect(
      dispatch.mock.calls.some(
        ([action]: [any]) => action?.type === appendClientCommand.type
      )
    ).toBe(false)
  })

  it('blocks new commands while the canonical journal is awaiting recovery', () => {
    const account = makeAccount({ id: 'cash', inBalance: false })
    const state = makeTestRootState(makeStore({ account: { cash: account } }))
    state.data.journalRecoveryRequired = true
    state.data.journalRecoveryReason = 'broken checkpoint'
    const dispatch = makeDispatch(state)

    dispatch(setAccountInBalance('cash', true))

    expect(
      dispatch.mock.calls.some(
        ([action]: [any]) => action?.type === appendClientCommand.type
      )
    ).toBe(false)
  })

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

  it('keeps direct transaction wrappers on the same sparse outbox path', () => {
    const first = makeTransaction({ id: 'first', viewed: false })
    const second = makeTransaction({ id: 'second', viewed: false })
    const dispatch = makeDispatch(
      makeTestRootState(makeStore({ transaction: { first, second } }))
    )

    dispatch(setTransactionsViewed(['first', 'second'], true))
    dispatch(applyChangesToTransaction({ id: 'first', comment: 'Edited' }))
    dispatch(
      bulkEditTransactions(['first', 'second'], {
        tags: ['food'],
        comment: 'Shared',
      })
    )

    expect(appendedPatches(dispatch)).toEqual([
      {
        transaction: [
          { id: 'first', viewed: true },
          { id: 'second', viewed: true },
        ],
      },
      { transaction: [{ id: 'first', comment: 'Edited' }] },
      {
        transaction: [
          { id: 'first', tag: ['food'], comment: 'Shared' },
          { id: 'second', tag: ['food'], comment: 'Shared' },
        ],
      },
    ])
  })

  it('creates a named merchant in the same command as the edit it belongs to', () => {
    const dispatch = makeDispatch(
      makeTestRootState(
        makeStore({
          user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
          transaction: { first: makeTransaction({ id: 'first' }) },
          merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
        })
      )
    )

    dispatch(
      applyChangesToTransaction({ id: 'first', payee: 'Kiosk' }, 'Kiosk')
    )
    dispatch(applyChangesToTransaction({ id: 'first', payee: 'Shop' }, 'Shop'))

    expect(appendedPatches(dispatch)).toEqual([
      {
        merchant: [{ id: UUID, title: 'Kiosk' }],
        transaction: [{ id: 'first', payee: 'Kiosk', merchant: UUID }],
      },
      // The title is taken, so nothing is created and the edit points at the
      // merchant that already carries it.
      { transaction: [{ id: 'first', payee: 'Shop', merchant: 'shop' }] },
    ])
  })
})

function appendedPatches(dispatch: any) {
  return dispatch.mock.calls
    .map(([action]: [any]) => action)
    .filter((action: any) => action?.type === appendClientCommand.type)
    .map((action: any) => operationPatch(action.payload))
}
