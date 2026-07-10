import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { applyClientPatch } from 'store/data'
import { makeDemoStore } from '../../demo'
import type { TNormalizedPatch } from '../../types'
import { applyPatch } from '../../zenmoney'
import {
  envelopeVisibility,
  envId,
  EnvType,
  getEnvelopeMeta,
  toEnvelopeStructureInput,
} from '../../zerro'
import { compileAppCommand, executeCommand } from './commands'
import { applyLegacyPatch } from './legacyPatch'
import { selectCoreEnvelopes, selectCoreEnvelopeStructure } from './selectors'

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
  it('compiles semantic envelope settings to entity and metadata state', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const tagId = Object.keys(current.tag)[0]
    const id = envId.get(EnvType.Tag, tagId)

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.settings.update',
        payload: {
          id,
          name: 'Configured',
          colorHex: '#00ff00',
          currency: 'EUR',
          visibility: envelopeVisibility.hidden,
          keepIncome: true,
        },
      },
      { now: () => NOW, uuid: () => 'settings-meta' }
    )
    const next = applyPatch(current, patch)

    expect(next.tag[tagId]).toMatchObject({
      title: 'Configured',
      color: 0x00ff00,
    })
    expect(getEnvelopeMeta(next)[id]).toMatchObject({
      currency: 'EUR',
      visibility: envelopeVisibility.hidden,
      keepIncome: true,
    })
  })

  it('normalizes unchanged presented null-tag settings to domain values', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const id = envId.get(EnvType.Tag, null)
    const presented = selectCoreEnvelopes(state)[id]

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.settings.update',
        payload: {
          id,
          name: presented.originalName,
          colorHex: presented.colorHex,
          currency: presented.currency,
          visibility: presented.visibility,
          keepIncome: presented.keepIncome,
        },
      },
      { now: () => NOW, uuid: () => 'unused' }
    )

    expect(patch).toEqual({})
  })

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

  it('moves an envelope to a new group through the structure command', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const input = toEnvelopeStructureInput(selectCoreEnvelopeStructure(state))
    const [moved, ...restChildren] = input[0].children

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.structure.apply',
        payload: [
          { ...input[0], children: restChildren },
          ...input.slice(1),
          { group: 'Custom', children: [moved] },
        ],
      },
      { now: () => NOW, uuid: () => 'structure-meta' }
    )
    const next = applyPatch(current, patch)
    const nextStructure = selectCoreEnvelopeStructure(makeState(next))
    const lastGroup = nextStructure[nextStructure.length - 1]

    expect(getEnvelopeMeta(next)[moved.id]).toMatchObject({ group: 'Custom' })
    expect(lastGroup.id).toBe('Custom')
    expect(lastGroup.children.map(child => child.id)).toContain(moved.id)
  })

  it('compiles an unchanged structure to an empty patch after indices settle', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const ctx = { now: () => NOW, uuid: () => 'structure-meta' }

    // The first identity apply may materialize implicit indices.
    const first = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.structure.apply',
        payload: toEnvelopeStructureInput(selectCoreEnvelopeStructure(state)),
      },
      ctx
    )
    const settled = makeState(applyPatch(current, first))

    // Presented default group labels normalize back to domain ids, so an
    // identity apply never writes groups or parents — only indices.
    Object.values(getEnvelopeMeta(settled.data.current)).forEach(meta => {
      expect(meta.group).toBeUndefined()
      expect(meta.parent).toBeUndefined()
    })

    const second = compileAppCommand(
      settled,
      {
        type: 'zerro.envelope.structure.apply',
        payload: toEnvelopeStructureInput(selectCoreEnvelopeStructure(settled)),
      },
      ctx
    )
    expect(second).toEqual({})
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
