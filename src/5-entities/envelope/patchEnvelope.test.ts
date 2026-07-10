import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { applyClientPatch } from 'store/data'
import { createEnvelope } from '4-features/envelope/createEnvelope'
import { makeDemoStore } from 'core-next/demo'
import { applyPatch } from 'core-next/zenmoney'
import {
  compilePatchEnvelope,
  envId,
  EnvType,
  getEnvelopeMeta,
} from 'core-next/zerro'
import { selectCoreEnvelopes } from 'core-next/adapters/redux'
import { patchEnvelope } from './patchEnvelope'

const NOW = Date.parse('2026-07-10T12:00:00Z')
const UUID = '00000000-0000-4000-8000-000000000001'

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

function makeThunkDispatch(initial: RootState) {
  let state = initial
  const dispatch = vi.fn((action: unknown) => {
    if (typeof action === 'function') {
      return (action as AppThunk)(dispatch as AppDispatch, () => state, undefined)
    }
    if ((action as { type?: string }).type === applyClientPatch.type) {
      state = makeState(
        applyPatch(state.data.current, (action as ReturnType<typeof applyClientPatch>).payload)
      )
    }
    return action
  })

  return { dispatch: dispatch as unknown as AppDispatch, getState: () => state }
}

describe('patchEnvelope', () => {
  it('dispatches one Core Next patch for entity and metadata changes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const current = makeDemoStore({ now: NOW })
    const [tagId] = Object.keys(current.tag)
    const id = envId.get(EnvType.Tag, tagId)
    const state = makeState(current)
    const draft = { id, originalName: 'Renamed', comment: 'Core comment' }
    const expected = compilePatchEnvelope(
      current,
      selectCoreEnvelopes(state),
      draft,
      { now: () => NOW, uuid: () => UUID }
    )
    // The thunk dispatches an executeCommand thunk; unwrap it like the store would
    const dispatch: any = vi.fn(action =>
      typeof action === 'function'
        ? action(dispatch, () => state, undefined)
        : action
    )

    patchEnvelope(draft)(dispatch, () => state, undefined)

    expect(expected.tag).toHaveLength(1)
    expect(expected.reminder).toHaveLength(1)
    expect(dispatch).toHaveBeenCalledWith(applyClientPatch(expected))
  })

  it('lets createEnvelope patch metadata after its new tag is in Redux state', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const runtime = makeThunkDispatch(makeState(makeDemoStore({ now: NOW })))

    const id = createEnvelope({ comment: 'Created through Core' })(
      runtime.dispatch,
      runtime.getState,
      undefined
    )

    expect(id).toBe(envId.get(EnvType.Tag, UUID))
    expect(selectCoreEnvelopes(runtime.getState())[id!]).toBeDefined()
    expect(getEnvelopeMeta(runtime.getState().data.current)[id!]).toMatchObject({
      id,
      comment: 'Created through Core',
    })
  })
})
