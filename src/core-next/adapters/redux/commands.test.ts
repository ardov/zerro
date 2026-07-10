import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { applyClientPatch } from 'store/data'
import { makeDemoStore } from '../../demo'
import type { TNormalizedPatch } from '../../types'
import { applyPatch } from '../../zenmoney'
import { envId, EnvType, getEnvelopeMeta } from '../../zerro'
import { compileAppCommand, executeCommand } from './commands'
import { applyLegacyPatch } from './legacyPatch'
import { selectCoreEnvelopes } from './selectors'

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
    typeof action === 'function'
      ? action(dispatch, () => state, undefined)
      : action
  )
  return dispatch
}

describe('executeCommand funnel', () => {
  it('compiles semantic envelope comment to resulting metadata state', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const id = envId.get(EnvType.Tag, Object.keys(current.tag)[0])

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.comment.set',
        payload: { id, comment: 'Semantic note' },
      },
      { now: () => NOW, uuid: () => 'comment-meta' }
    )
    const next = applyPatch(current, patch)

    expect(getEnvelopeMeta(next)[id]?.comment).toBe('Semantic note')
  })

  it('compiles semantic envelope color to resulting tag state', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const tagId = Object.keys(current.tag)[0]
    const id = envId.get(EnvType.Tag, tagId)

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.color.set',
        payload: { id, colorHex: '#00ff00' },
      },
      { now: () => NOW, uuid: () => 'test-id' }
    )
    const next = applyPatch(current, patch)

    expect(next.tag[tagId].color).toBe(0x00ff00)
  })

  it('compiles semantic envelope rename to resulting entity state', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const id = envId.get(EnvType.Tag, Object.keys(current.tag)[0])

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.rename',
        payload: { id, name: 'Renamed through command' },
      },
      { now: () => NOW, uuid: () => 'test-id' }
    )
    const next = applyPatch(current, patch)

    expect(next.tag[Object.keys(current.tag)[0]].title).toBe(
      'Renamed through command'
    )
  })

  it('normalizes presented default groups before domain compilation', () => {
    const state = makeState(makeDemoStore({ now: NOW }))
    const id = envId.get(EnvType.Tag, null)
    const presentedGroup = selectCoreEnvelopes(state)[id].group

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.patch',
        payload: [{ id, group: presentedGroup }],
      },
      { now: () => NOW, uuid: () => 'test-id' }
    )

    expect(patch).toEqual({})
  })

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

    dispatch(executeCommand({ type: 'legacy.patch', payload: {} }))

    const actions = dispatch.mock.calls
      .map(([action]: [unknown]) => action)
      .filter((action: unknown) => typeof action !== 'function')
    expect(actions).toEqual([])
  })
})
