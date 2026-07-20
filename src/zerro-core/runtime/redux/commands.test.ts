import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import { appendClientCommand } from 'store/data'
import { makeTestRootState } from '../../support/testing/rootState'
import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../support/testing/zenmoneyTestData'
import {
  applyChangesToTransaction,
  bulkEditTransactions,
  setAccountInBalance,
  setTransactionsViewed,
} from './commands'

function makeDispatch(state: RootState) {
  const dispatch: any = vi.fn(action =>
    typeof action === 'function'
      ? action(dispatch, () => state, undefined)
      : action
  )
  return dispatch
}

describe('Redux semantic commands', () => {
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
