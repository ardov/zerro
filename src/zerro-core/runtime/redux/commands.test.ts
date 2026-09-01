import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { appendClientCommand } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import {
  makeAccount,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import {
  applyChangesToTransaction,
  bulkEditTransactions,
  createTransaction,
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
      createTransaction({
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
      store.getState().data.outbox[0].patch.transaction?.[0]
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
          patch: { account: [{ id: 'cash', inBalance: true }] },
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

    const patches = dispatch.mock.calls
      .map(([action]: [any]) => action)
      .filter((action: any) => action?.type === appendClientCommand.type)
      .map((action: any) => action.payload.patch)

    expect(patches).toEqual([
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
})
