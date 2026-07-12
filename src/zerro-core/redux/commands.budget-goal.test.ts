import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'
import { makeDemoStore } from '../demo'
import { applyPatch } from '../domain/zenmoney'
import {
  compilePatchUserSettings,
  compileSetBudget,
  compileSetGoal,
  envId,
  EnvType,
  goalType,
} from '../domain/zerro'
import { setBudget, setGoal } from './commands'

const NOW = Date.parse('2026-07-10T12:00:00Z')
const UUID = '00000000-0000-4000-8000-000000000001'
const MONTH = '2026-07' as const
const NEXT_MONTH = '2026-08' as const

vi.mock('uuid', () => ({ v1: () => UUID }))

afterEach(() => vi.restoreAllMocks())

function makeState(current: RootState['data']['current']): RootState {
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

describe('budget and goal Redux commands', () => {
  it('routes a mixed budget update through the outbox', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const base = makeDemoStore({ now: NOW })
    const current = applyPatch(
      base,
      compilePatchUserSettings(
        base,
        { preferZmBudgets: true },
        {
          now: () => NOW,
          uuid: (() => {
            const ids = ['data-account', 'settings-reminder']
            return () => ids.shift() || 'unused'
          })(),
        }
      )
    )
    const [tagId] = Object.keys(current.tag)
    const [accountId] = Object.keys(current.account)
    const updates = [
      { id: envId.get(EnvType.Tag, tagId), month: MONTH, value: 100 },
      { id: envId.get(EnvType.Account, accountId), month: MONTH, value: 200 },
    ]
    const expected = compileSetBudget(current, updates, {
      now: () => NOW,
      uuid: () => UUID,
    })
    const state = makeState(current)
    const dispatch = makeDispatch(state)

    setBudget(updates)(dispatch, () => state, undefined)

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientOutboxEntry.type,
        payload: expect.objectContaining({
          command: { type: 'zerro.budget.set', payload: updates },
          intentPatch: expected,
          appliedPatch: expected,
        }),
      })
    )
  })

  it('routes a goal update and clears the nearest future blocker', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const base = makeDemoStore({ now: NOW })
    const [tagId] = Object.keys(base.tag)
    const id = envId.get(EnvType.Tag, tagId)
    const current = applyPatch(
      base,
      compileSetGoal(base, NEXT_MONTH, id, null, {
        now: () => NOW,
        uuid: (() => {
          const ids = ['data-account', 'blocker-reminder']
          return () => ids.shift() || 'unused'
        })(),
      })
    )
    const goal = { type: goalType.MONTHLY, amount: 100 }
    const expected = compileSetGoal(current, MONTH, id, goal, {
      now: () => NOW,
      uuid: () => UUID,
    })
    const state = makeState(current)
    const dispatch = makeDispatch(state)

    setGoal(MONTH, id, goal)(dispatch, () => state, undefined)

    expect(expected.deletion).toHaveLength(1)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: appendClientOutboxEntry.type,
        payload: expect.objectContaining({
          command: {
            type: 'zerro.goal.set',
            payload: { month: MONTH, id, goal },
          },
          intentPatch: expected,
          appliedPatch: expected,
        }),
      })
    )
  })
})
