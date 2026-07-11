import { afterEach, describe, expect, it, vi } from 'vitest'

import { appendClientOutboxEntry } from 'store/data'
import type { RootState } from 'store'
import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from 'core-next/testing/zenmoneyTestData'
import { deleteReminder, setReminder } from './setReminder'

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
    data: { current, server: current, diff: undefined },
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

describe('reminder semantic writes', () => {
  it('returns created reminders and appends a semantic outbox entry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState()
    const dispatch = makeDispatch(state)

    const reminders = dispatch(
      setReminder({
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        comment: 'Rent',
      })
    )

    expect(reminders).toHaveLength(1)
    expect(reminders[0]).toMatchObject({ id: UUID, comment: 'Rent', user: 1 })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientOutboxEntry.type,
        payload: expect.objectContaining({
          command: expect.objectContaining({ type: 'zenmoney.reminder.set' }),
          appliedPatch: { reminder: reminders },
        }),
      })
    )
  })

  it('appends semantic deletion only when the reminder exists', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const state = makeState(true)
    const dispatch = makeDispatch(state)

    dispatch(deleteReminder('existing'))

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientOutboxEntry.type,
        payload: expect.objectContaining({
          command: {
            type: 'zenmoney.reminder.delete',
            payload: { id: 'existing' },
          },
          appliedPatch: {
            deletion: [
              expect.objectContaining({ id: 'existing', stamp: NOW, user: 1 }),
            ],
          },
        }),
      })
    )

    const missingDispatch = makeDispatch(state)
    missingDispatch(deleteReminder('missing'))
    expect(
      missingDispatch.mock.calls.filter(
        ([action]: [any]) => action?.type === appendClientOutboxEntry.type
      )
    ).toEqual([])
  })
})
