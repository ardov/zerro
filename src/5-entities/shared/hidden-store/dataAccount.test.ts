import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'
import {
  makeAccount,
  makeStore,
  makeUser,
} from 'core-next/testing/zenmoneyTestData'
import { DATA_ACC_NAME, prepareDataAccount } from './dataAccount'

const NOW = Date.parse('2026-07-11T12:00:00Z')
const UUID = 'data-account-new'

vi.mock('uuid', () => ({ v1: () => UUID }))

afterEach(() => vi.restoreAllMocks())

function makeState(hasDataAccount = false): RootState {
  const current = makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 7 }) },
    account: hasDataAccount
      ? {
          existing: makeAccount({
            id: 'existing',
            title: DATA_ACC_NAME,
            instrument: 7,
          }),
        }
      : {},
  })
  return {
    data: { current, base: current },
    displayCurrency: null,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
  }
}

function makeDispatch(state: RootState) {
  const dispatch: any = vi.fn(action =>
    typeof action === 'function'
      ? action(dispatch, () => state, undefined)
      : action
  )
  return dispatch
}

describe('prepareDataAccount', () => {
  it('creates the hidden data account through an infrastructure outbox entry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState()
    const dispatch = makeDispatch(state)

    expect(dispatch(prepareDataAccount())).toBe(UUID)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientOutboxEntry.type,
        payload: expect.objectContaining({
          command: { type: 'infrastructure.dataAccount.prepare' },
          appliedPatch: {
            account: [
              expect.objectContaining({
                id: UUID,
                title: DATA_ACC_NAME,
                instrument: 7,
                user: 1,
              }),
            ],
          },
        }),
      })
    )
  })

  it('returns the existing account without appending an entry', () => {
    const dispatch = makeDispatch(makeState(true))

    expect(dispatch(prepareDataAccount())).toBe('existing')
    expect(
      dispatch.mock.calls.filter(
        ([action]: [any]) => action?.type === appendClientOutboxEntry.type
      )
    ).toEqual([])
  })
})
