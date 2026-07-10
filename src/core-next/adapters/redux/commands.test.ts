import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { applyClientPatch } from 'store/data'
import { makeDemoStore } from '../../demo'
import type { TNormalizedPatch } from '../../types'
import { executeCommand } from './commands'
import { applyLegacyPatch } from './legacyPatch'

// Breaks the legacy hidden-store import cycle, same as the private fixture tests.
vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in this test')
  },
}))

const NOW = Date.parse('2026-07-10T12:00:00Z')

function makeState(current: TDataStore): RootState {
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
    typeof action === 'function' ? action(dispatch, () => state, undefined) : action
  )
  return dispatch
}

describe('executeCommand funnel', () => {
  it('applies a legacy patch as-is', () => {
    const state = makeState(makeDemoStore({ now: NOW }))
    const [tagId] = Object.keys(state.data.current.tag)
    const patch: TNormalizedPatch = {
      tag: [{ ...state.data.current.tag[tagId], title: 'Funneled' }],
    }
    const dispatch = makeDispatch(state)

    dispatch(applyLegacyPatch(patch))

    expect(dispatch).toHaveBeenCalledWith(applyClientPatch(patch))
  })

  it('skips empty patches entirely', () => {
    const state = makeState(makeDemoStore({ now: NOW }))
    const dispatch = makeDispatch(state)

    dispatch(executeCommand({ v: 1, type: 'legacy.patch', payload: {} }))

    const actions = dispatch.mock.calls
      .map(([action]: [unknown]) => action)
      .filter((action: unknown) => typeof action !== 'function')
    expect(actions).toEqual([])
  })
})
