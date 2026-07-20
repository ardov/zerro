import { afterEach, describe, expect, it, vi } from 'vitest'

import { appendClientCommand } from 'store/data'
import type { RootState } from 'store'
import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import { remove, set } from './reminders'

const NOW = Date.parse('2026-07-11T12:00:00Z')
const UUID = 'reminder-new'

vi.mock('uuid', () => ({ v1: () => UUID }))

afterEach(() => vi.restoreAllMocks())

function makeState(withReminder = false): RootState {
  const current = makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: {
      cash: makeAccount({ id: 'cash' }),
      card: makeAccount({ id: 'card' }),
    },
    reminder: withReminder
      ? { existing: makeReminder({ id: 'existing' }) }
      : {},
  })
  return {
    data: { current, base: current, outbox: [], outboxHead: 0 },
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

describe('reminder Redux commands', () => {
  it('returns created reminders and appends a semantic outbox entry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState()
    const dispatch = makeDispatch(state)

    const reminders = dispatch(
      set({
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        comment: 'Rent',
      })
    )

    expect(reminders).toHaveLength(1)
    expect(reminders[0]).toMatchObject({ id: UUID, comment: 'Rent', user: 1 })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientCommand.type,
        payload: expect.objectContaining({
          type: 'patch',
          patch: {
            reminder: [
              {
                id: UUID,
                incomeAccount: 'cash',
                outcomeAccount: 'card',
                comment: 'Rent',
              },
            ],
          },
        }),
      })
    )
  })

  it('stores only changed fields when patching an existing reminder', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState(true)
    const dispatch = makeDispatch(state)

    const reminders = dispatch(set({ id: 'existing', comment: 'Updated' }))

    expect(reminders[0]).toMatchObject({
      id: 'existing',
      comment: 'Updated',
    })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientCommand.type,
        payload: expect.objectContaining({
          patch: {
            reminder: [{ id: 'existing', comment: 'Updated' }],
          },
        }),
      })
    )
  })

  it('appends semantic deletion only when the reminder exists', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState(true)
    const dispatch = makeDispatch(state)

    dispatch(remove('existing'))

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientCommand.type,
        payload: expect.objectContaining({
          type: 'patch',
          patch: {
            deletion: [
              expect.objectContaining({
                id: 'existing',
                object: 'reminder',
              }),
            ],
          },
        }),
      })
    )

    const missingDispatch = makeDispatch(state)
    missingDispatch(remove('missing'))
    expect(
      missingDispatch.mock.calls.filter(
        ([action]: [any]) => action?.type === appendClientCommand.type
      )
    ).toEqual([])
  })
})
