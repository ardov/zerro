import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TDataStore, TISOMonth } from '6-shared/types'
import type { RootState } from 'store'
import { applyClientPatch } from 'store/data'
import { makeDemoStore } from 'core-next/demo'
import { applyPatch } from 'core-next/zenmoney'
import {
  compileSetGoal,
  envId,
  EnvType,
  goalType,
} from 'core-next/zerro'
import { sendEvent } from '6-shared/helpers/tracking'
import { setGoal } from './setGoal'

const NOW = Date.parse('2026-07-10T12:00:00Z')
const UUID = '00000000-0000-4000-8000-000000000001'
const MONTH = '2026-07' as TISOMonth
const NEXT_MONTH = '2026-08' as TISOMonth

vi.mock('uuid', () => ({ v1: () => UUID }))
vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

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

describe('setGoal', () => {
  it('dispatches the Core Next patch and clears the nearest future blocker', () => {
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
    const dispatch = vi.fn()

    setGoal(MONTH, id, goal)(dispatch, () => makeState(current), undefined)

    expect(expected.reminder).toHaveLength(1)
    expect(expected.deletion).toHaveLength(1)
    expect(dispatch).toHaveBeenCalledWith(applyClientPatch(expected))
    expect(sendEvent).toHaveBeenCalledWith('Goals: set monthly goal')
  })

  it('keeps delete tracking for an empty goal draft', () => {
    const current = makeDemoStore({ now: NOW })
    const [tagId] = Object.keys(current.tag)
    const dispatch = vi.fn()

    setGoal(MONTH, envId.get(EnvType.Tag, tagId), undefined)(
      dispatch,
      () => makeState(current),
      undefined
    )

    expect(dispatch).toHaveBeenCalledOnce()
    expect(sendEvent).toHaveBeenCalledWith('Goals: delete goal')
  })
})
