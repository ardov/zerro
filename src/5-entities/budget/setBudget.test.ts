import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TDataStore, TISOMonth } from '6-shared/types'
import { applyClientPatch } from 'store/data'
import type { RootState } from 'store'
import { makeDemoStore } from 'core-next/demo'
import { applyPatch } from 'core-next/zenmoney'
import {
  compilePatchUserSettings,
  compileSetBudget,
  envId,
  EnvType,
} from 'core-next/zerro'
import { setBudget } from './setBudget'

const NOW = Date.parse('2026-07-10T12:00:00Z')
const UUID = '00000000-0000-4000-8000-000000000001'
const MONTH = '2026-07' as TISOMonth

vi.mock('uuid', () => ({ v1: () => UUID }))

afterEach(() => vi.restoreAllMocks())

function makeState(current: TDataStore): RootState {
  return {
    data: { current, server: current, diff: undefined },
    displayCurrency: null,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
  }
}

describe('setBudget', () => {
  it('dispatches the Core Next patch for mixed tag and envelope budgets', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const base = makeDemoStore({ now: NOW })
    const current = applyPatch(
      base,
      compilePatchUserSettings(base, { preferZmBudgets: true }, {
        now: () => NOW,
        uuid: (() => {
          const ids = ['data-account', 'settings-reminder']
          return () => ids.shift() || 'unused'
        })(),
      })
    )
    const [tagId] = Object.keys(current.tag)
    const [accountId] = Object.keys(current.account)
    const updates = [
      { id: envId.get(EnvType.Tag, tagId), month: MONTH, value: 100 },
      { id: envId.get(EnvType.Account, accountId), month: MONTH, value: 200 },
    ]
    const state = makeState(current)
    // The thunk dispatches an executeCommand thunk; unwrap it like the store would
    const dispatch: any = vi.fn(action =>
      typeof action === 'function'
        ? action(dispatch, () => state, undefined)
        : action
    )
    const expected = compileSetBudget(current, updates, {
      now: () => NOW,
      uuid: () => UUID,
    })

    setBudget(updates)(dispatch, () => state, undefined)

    expect(expected.budget).toHaveLength(1)
    expect(expected.reminder).toHaveLength(1)
    expect(dispatch).toHaveBeenCalledWith(applyClientPatch(expected))
  })

  it('does not dispatch an empty patch', () => {
    const state = makeState(makeDemoStore({ now: NOW }))
    const dispatch: any = vi.fn(action =>
      typeof action === 'function'
        ? action(dispatch, () => state, undefined)
        : action
    )

    setBudget([])(dispatch, () => state, undefined)

    const actions = dispatch.mock.calls
      .map(([action]: [unknown]) => action)
      .filter((action: unknown) => typeof action !== 'function')
    expect(actions).toEqual([])
  })
})
