import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'
import { makeDemoStore } from '../../demo'
import { applyPatch } from '../../zenmoney'
import {
  makeAccount,
  makeReminder,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../testing/zenmoneyTestData'
import {
  envelopeVisibility,
  envId,
  EnvType,
  getEnvelopeMeta,
  toEnvelopeStructureInput,
} from '../../zerro'
import {
  compileAppCommand,
  executeCommand,
  recreateTransaction,
} from './commands'
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
    data: { current, base: current },
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

  it('compiles transaction deletion to resulting state', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const [softId, hardId] = Object.keys(current.transaction)
    const ctx = { now: () => NOW, uuid: () => 'unused' }

    const softDeleted = applyPatch(
      current,
      compileAppCommand(
        state,
        { type: 'zenmoney.transaction.delete', payload: { ids: [softId] } },
        ctx
      )
    )
    const hardDeleted = applyPatch(
      current,
      compileAppCommand(
        state,
        {
          type: 'zenmoney.transaction.delete.permanent',
          payload: { ids: [hardId] },
        },
        ctx
      )
    )

    expect(softDeleted.transaction[softId]).toMatchObject({
      deleted: true,
      changed: NOW,
    })
    expect(hardDeleted.transaction[hardId]).toMatchObject({
      income: 0.00001,
      outcome: 0.00001,
    })
  })

  it('restores a deleted transaction under a new id', () => {
    const current = makeDemoStore({ now: NOW })
    const [id] = Object.keys(current.transaction)
    const ctx = { now: () => NOW, uuid: () => 'restored-transaction' }

    const deleted = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        { type: 'zenmoney.transaction.delete', payload: { ids: [id] } },
        ctx
      )
    )
    const restored = applyPatch(
      deleted,
      compileAppCommand(
        makeState(deleted),
        { type: 'zenmoney.transaction.restore', payload: { id } },
        ctx
      )
    )

    expect(restored.transaction['restored-transaction']).toMatchObject({
      deleted: false,
      changed: NOW,
    })
  })

  it('marks transactions viewed only when the state changes', () => {
    const current = makeDemoStore({ now: NOW })
    const [id] = Object.keys(current.transaction)
    const ctx = { now: () => NOW, uuid: () => 'unused' }

    const marked = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.transaction.viewed.set',
          payload: { ids: [id], viewed: false },
        },
        ctx
      )
    )
    const repeat = compileAppCommand(
      makeState(marked),
      {
        type: 'zenmoney.transaction.viewed.set',
        payload: { ids: [id], viewed: false },
      },
      ctx
    )

    expect(marked.transaction[id]).toMatchObject({
      viewed: false,
      changed: NOW,
    })
    expect(repeat.transaction).toEqual([])
  })

  it('applies transaction field changes through the update command', () => {
    const current = makeDemoStore({ now: NOW })
    const [id] = Object.keys(current.transaction)

    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.transaction.update',
          payload: { id, comment: 'Edited through command' },
        },
        { now: () => NOW, uuid: () => 'unused' }
      )
    )

    expect(next.transaction[id]).toMatchObject({
      comment: 'Edited through command',
      changed: NOW,
    })
  })

  it('recreates a transaction and returns the new id as a receipt', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const [id] = Object.keys(current.transaction)
    const dispatch = makeDispatch(state)

    const newId = dispatch(recreateTransaction({ id, comment: 'Recreated' }))

    const entries = dispatch.mock.calls
      .map(([action]: [any]) => action)
      .filter((action: any) => action?.type === appendClientOutboxEntry.type)
    expect(entries).toHaveLength(1)
    const [oldTr, newTr] = entries[0].payload.appliedPatch.transaction
    expect(newId).toBe(newTr.id)
    expect(newId).not.toBe(id)
    expect(oldTr).toMatchObject({ id, income: 0.00001, outcome: 0.00001 })
    expect(newTr.comment).toBe('Recreated')
  })

  it('bulk-edits transaction tags and comments', () => {
    const current = makeDemoStore({ now: NOW })
    const ids = Object.keys(current.transaction).slice(0, 2)
    const [tagId] = Object.keys(current.tag)

    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.transaction.bulk.edit',
          payload: { ids, tags: [tagId], comment: 'Bulk comment' },
        },
        { now: () => NOW, uuid: () => 'unused' }
      )
    )

    ids.forEach(id => {
      expect(next.transaction[id]).toMatchObject({
        tag: [tagId],
        comment: 'Bulk comment',
        changed: NOW,
      })
    })
  })

  it('toggles account budget participation to resulting state', () => {
    const current = makeDemoStore({ now: NOW })
    const [id] = Object.keys(current.account)
    const inBalance = !current.account[id].inBalance

    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.account.inBalance.set',
          payload: { id, inBalance },
        },
        { now: () => NOW, uuid: () => 'unused' }
      )
    )

    expect(next.account[id]).toMatchObject({ inBalance, changed: NOW })
  })

  it('routes a combine-to-outcome command to resulting state', () => {
    const current = makeStore({
      transaction: {
        out: makeTransaction({
          id: 'out',
          income: 0,
          outcome: 100,
          outcomeInstrument: 1,
          outcomeAccount: 'card',
        }),
        in: makeTransaction({
          id: 'in',
          income: 40,
          incomeInstrument: 1,
          incomeAccount: 'card',
          outcome: 0,
        }),
      },
    })

    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.transaction.combineToOutcome',
          payload: { ids: ['out', 'in'] },
        },
        { now: () => NOW, uuid: () => 'unused' }
      )
    )

    expect(next.transaction.in.deleted).toBe(true)
    expect(next.transaction.out).toMatchObject({ outcome: 60, changed: NOW })
  })

  it('routes an account merge command to transactions and reminders', () => {
    const current = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        source: makeAccount({ id: 'source', instrument: 1 }),
        target: makeAccount({ id: 'target', instrument: 1 }),
      },
      transaction: {
        spend: makeTransaction({
          id: 'spend',
          outcomeAccount: 'source',
          outcome: 10,
        }),
      },
      reminder: {
        planned: makeReminder({
          id: 'planned',
          incomeAccount: 'target',
          outcomeAccount: 'source',
        }),
      },
    })

    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zenmoney.account.merge',
          payload: { source: 'source', target: 'target' },
        },
        { now: () => NOW, uuid: () => 'unused' }
      )
    )

    expect(next.account.source).toBeUndefined()
    expect(next.transaction.spend.outcomeAccount).toBe('target')
    expect(next.reminder.planned.outcomeAccount).toBe('target')
  })
})
