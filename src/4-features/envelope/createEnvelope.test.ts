import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '6-shared/localization'
import type { TDataStore } from '6-shared/types'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'
import { makeDemoStore } from 'core-next/demo'
import { applyPatch } from 'core-next/zenmoney'
import {
  defaultEnvelopeGroupIds,
  envId,
  EnvType,
  getEnvelopeMeta,
} from 'core-next/zerro'
import { selectCoreEnvelopes } from 'core-next/adapters/redux'
import { createEnvelope } from './createEnvelope'

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
      return (action as AppThunk)(
        dispatch as AppDispatch,
        () => state,
        undefined
      )
    }
    if ((action as { type?: string }).type === appendClientOutboxEntry.type) {
      state = makeState(
        applyPatch(
          state.data.current,
          (action as ReturnType<typeof appendClientOutboxEntry>).payload
            .appliedPatch
        )
      )
    }
    return action
  })

  return { dispatch: dispatch as unknown as AppDispatch, getState: () => state }
}

describe('createEnvelope', () => {
  it('creates an envelope and metadata through one semantic command', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const runtime = makeThunkDispatch(makeState(makeDemoStore({ now: NOW })))

    const id = createEnvelope({
      comment: 'Created through Core',
      group: i18n.t('defaultTagGroup', { ns: 'common' }),
      index: 2,
    })(runtime.dispatch, runtime.getState, undefined)

    expect(id).toBe(envId.get(EnvType.Tag, UUID))
    expect(selectCoreEnvelopes(runtime.getState())[id!]).toBeDefined()
    expect(getEnvelopeMeta(runtime.getState().data.current)[id!]).toMatchObject(
      {
        id,
        comment: 'Created through Core',
        group: defaultEnvelopeGroupIds.tags,
        index: 2,
      }
    )
  })
})
