import { prepareTestCommand as prepareCommand } from '../../../support/testing/commandTestData'
import { describe, it, expect } from 'vitest'
import {
  makeStore,
  makeAccount,
  makeReminder,
  makeUser,
  makeTransaction,
} from '../../../support/testing/zenmoneyTestData'
import { prepareZerro } from '../../domain/zerro/operations/prepare'
import type { TZerroIntent } from '../../domain/zerro/operations/types'
import {
  materializeCommand,
  prepareCommand as prepareOperations,
} from './materializeCommand'
import {
  replayOutbox,
  parseCommandOutbox,
  undoOutbox,
  redoOutbox,
} from '../replication/outbox'
import { beginPush, acceptPushChunk } from '../replication/pushRun'
import { applyPatch } from '../../domain/zenmoney'
const month = '2026-09'
const food = 'tag#food' as const
const ctx = {
  now: () => 1000,
  uuid: (() => {
    let n = 0
    return () => `reserved-${n++}`
  })(),
}
function base(payload: object = { [food]: 10 }) {
  return makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: { data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }) },
    reminder: {
      doc: makeReminder({
        id: 'doc',
        incomeAccount: 'data',
        outcomeAccount: 'data',
        comment: JSON.stringify({
          type: 'budgets',
          month,
          payload,
          future: 42,
        }),
      }),
    },
  })
}
function issue(data: ReturnType<typeof base>, ...intents: TZerroIntent[]) {
  return prepareCommand(data, prepareZerro(data, intents, ctx), ctx.now())
}
function value(data: ReturnType<typeof base>, id = 'doc') {
  return JSON.parse(data.reminder[id].comment!).payload
}
const budget = (amount: number): TZerroIntent => ({
  type: 'budgets.set',
  month,
  values: [{ envelopeId: food, amount }],
  nativeTags: false,
})

describe('unified command lifecycle', () => {
  it('prepares mixed operations in order and preserves the action label across reload and undo/redo', () => {
    const original = base()
    const label = { verb: 'settings-changed' as const }
    const command = prepareOperations(
      original,
      [
        { type: 'merchant.create', value: { id: 'shop', title: 'First' } },
        { type: 'merchant.patch', value: { id: 'shop', title: 'Second' } },
        ...prepareZerro(
          original,
          [{ type: 'settings.patch', set: { emojiIcons: false } }],
          ctx
        ).operations,
      ],
      ctx.now(),
      label
    )
    const restored = parseCommandOutbox(JSON.parse(JSON.stringify([command])))
    const current = replayOutbox(original, restored)
    expect(current.merchant.shop.title).toBe('Second')
    expect(original.merchant.shop).toBeUndefined()
    expect(restored[0].label).toEqual(label)
    const undone = undoOutbox(restored, [])
    expect(replayOutbox(original, undone.outbox).merchant.shop).toBeUndefined()
    const redone = redoOutbox(undone.outbox, undone.redo)
    expect(redone.outbox[0].label).toEqual(label)
    expect(replayOutbox(original, redone.outbox)).toEqual(current)
  })

  it('normalizes direct entity operations before persistence and rejects malformed identities', () => {
    const original = base()
    const incoming = { id: 'data', title: 'Renamed', balance: 999 }
    const command = prepareOperations(
      original,
      [
        {
          type: 'account.patch',
          value: incoming,
        },
      ],
      1000
    )
    const current = replayOutbox(original, [command])
    expect(current.account.data.title).toBe('Renamed')
    expect(current.account.data.balance).toBe(original.account.data.balance)
    expect(command.operations[0]).not.toHaveProperty('value.balance')
    expect(() =>
      prepareOperations(
        original,
        [{ type: 'merchant.patch', value: null } as never],
        1000
      )
    ).toThrow('Invalid entity fields')
  })

  it('stores a concrete budget, preserves server fields, and reloads with the same undo/redo result', () => {
    const original = base()
    const command = issue(original, budget(30))
    expect(command).not.toHaveProperty('type')
    expect(command).not.toHaveProperty('patch')
    expect(command.operations[0].type).toBe('budgets.set')
    const restored = parseCommandOutbox(JSON.parse(JSON.stringify([command])))
    const remote = base({ [food]: 20, 'tag#other': 90 })
    const current = replayOutbox(remote, restored)
    expect(value(current)).toEqual({ [food]: 30, 'tag#other': 90 })
    expect(JSON.parse(current.reminder.doc.comment!).future).toBe(42)
    expect(replayOutbox(current, restored)).toEqual(current)
    const undone = undoOutbox(restored, [])
    expect(replayOutbox(remote, undone.outbox)).toEqual(remote)
    expect(
      replayOutbox(remote, redoOutbox(undone.outbox, undone.redo).outbox)
    ).toEqual(current)
    expect(value(remote)[food]).toBe(20)
  })

  it('creates storage with reserved IDs, reuses incoming storage, and preserves other reminder fields', () => {
    const empty = makeStore({ user: base().user })
    const command = issue(empty, budget(40))
    const once = replayOutbox(empty, [command])
    expect(replayOutbox(empty, [command])).toEqual(once)
    expect(Object.keys(once.account)).toHaveLength(1)
    expect(Object.keys(once.reminder)).toHaveLength(1)
    const remote = base({ 'tag#remote': 70 })
    remote.reminder.doc.income = 17
    const current = replayOutbox(remote, [command])
    expect(Object.keys(current.reminder)).toEqual(['doc'])
    expect(Object.keys(current.account)).toEqual(['data'])
    expect(current.reminder.doc.income).toBe(17)
    expect(value(current)).toEqual({ 'tag#remote': 70, [food]: 40 })
  })

  it('keeps a concurrent budget when clearing the last locally known entry', () => {
    const command = issue(base(), budget(0))
    expect(
      value(replayOutbox(base({ [food]: 10, 'tag#remote': 70 }), [command]))
    ).toEqual({ 'tag#remote': 70 })
  })

  it('treats goals atomically and distinguishes stop from clear', () => {
    const original = base()
    original.reminder.doc.comment = JSON.stringify({
      type: 'goals',
      month,
      payload: {
        [food]: { type: 'targetBalance', amount: 500, end: '2027-01-01' },
      },
    })
    const set = issue(original, {
      type: 'goals.set',
      month,
      envelopeId: food,
      goal: { type: 'monthly', amount: 80 },
    })
    expect(value(replayOutbox(original, [set]))[food]).toEqual({
      type: 'monthly',
      amount: 80,
    })
    const stop = issue(original, {
      type: 'goals.stop',
      month,
      envelopeId: food,
    })
    expect(value(replayOutbox(original, [stop]))[food]).toBeNull()
    const clear = issue(original, {
      type: 'goals.clearOverride',
      month,
      envelopeId: food,
    })
    expect(replayOutbox(original, [clear]).reminder).toEqual({})
  })

  it('skips edits of deleted transactions, but preserves creation IDs for subsequent references', () => {
    const original = base()
    original.transaction.t = makeTransaction({ id: 't', comment: 'Before' })
    const edit = prepareCommand(
      original,
      { transaction: [{ id: 't', comment: 'After' }] },
      1000
    )
    expect(edit.operations[0].type).toBe('transaction.patch')
    const deleted = { ...original, transaction: {} }
    expect(materializeCommand(deleted, edit)).toEqual({})
    const softDeleted = {
      ...original,
      transaction: { t: { ...original.transaction.t, deleted: true } },
    }
    expect(materializeCommand(softDeleted, edit)).toEqual({})
    const create = prepareCommand(
      original,
      { merchant: [{ id: 'new-merchant', title: 'Shop' }] },
      1000
    )
    const created = replayOutbox(original, [create])
    const reference = prepareCommand(
      created,
      { transaction: [{ id: 't', merchant: 'new-merchant' }] },
      1001
    )
    expect(
      replayOutbox(original, [create, reference]).transaction.t.merchant
    ).toBe('new-merchant')
  })

  it('acknowledges only the captured prefix and quietly retires redundant commands', () => {
    const original = base()
    const first = issue(original, budget(30))
    const prepared = beginPush({ base: original, outbox: [first] }, 2000)!
    const later = issue(replayOutbox(original, [first]), budget(50))
    const accepted = acceptPushChunk(
      { base: original, outbox: [first, later] },
      prepared,
      prepared.request
    )
    expect(accepted.outbox).toEqual([later])
    expect(value(accepted.current)[food]).toBe(50)
    const same = issue(original, budget(10))
    const noChange = beginPush({ base: original, outbox: [same] }, 2000)!
    expect(noChange.requestItemCount).toBe(0)
    expect(
      acceptPushChunk({ base: original, outbox: [same] }, noChange, {}).outbox
    ).toEqual([])
  })

  it('keeps the existing large-upload path as concrete entity operations after the first acknowledgement', () => {
    const original = base()
    const command = issue(original, budget(30), {
      type: 'settings.patch',
      set: { emojiIcons: true },
    })
    const prepared = beginPush({ base: original, outbox: [command] }, 2000, {
      maxBytes: 1,
    })!
    const first = acceptPushChunk(
      { base: original, outbox: [command] },
      prepared,
      prepared.request
    )
    expect(first.next).toBeDefined()
    expect(
      first.outbox[0].operations.every(op => op.type.startsWith('reminder.'))
    ).toBe(true)
    const second = acceptPushChunk(first, first.next!, first.next!.request)
    expect(second.outbox).toEqual([])
    expect(value(second.current)[food]).toBe(30)
  })

  it('merges metadata and FX fields without claiming unrelated server values', () => {
    const original = base()
    original.reminder.doc.comment = JSON.stringify({
      type: 'EnvelopeMeta',
      payload: {
        [food]: { id: food, group: 'old', comment: 'before', future: 7 },
      },
      wrapper: 9,
    })
    const meta = issue(original, {
      type: 'envelopes.patchMeta',
      envelopeId: food,
      set: { comment: 'after' },
      unset: ['group'],
    })
    expect(value(replayOutbox(original, [meta]))[food]).toEqual({
      id: food,
      comment: 'after',
      future: 7,
    })
    original.reminder.doc.comment = JSON.stringify({
      type: 'fxRates',
      month,
      payload: { rates: { USD: 80, EUR: 90 }, future: 7 },
      wrapper: 9,
    })
    const fx = issue(original, {
      type: 'fxRates.patch',
      month,
      set: { USD: 85 },
    })
    const current = replayOutbox(original, [fx])
    expect(value(current)).toMatchObject({
      rates: { USD: 85, EUR: 90 },
      future: 7,
      changed: 1000,
    })
    expect(JSON.parse(current.reminder.doc.comment!).wrapper).toBe(9)
  })

  it('rejects the old format instead of silently discarding pending work', () => {
    expect(() =>
      parseCommandOutbox([{ type: 'patch', patch: {}, issuedAt: 1 }])
    ).toThrow('unsupported format')
  })

  it('does not create storage for an empty patch or absent-field removal', () => {
    const original = makeStore({ user: base().user })
    for (const intent of [
      { type: 'settings.patch', unset: ['emojiIcons'] },
      { type: 'envelopes.patchMeta', envelopeId: food, unset: ['group'] },
      { type: 'goals.clearOverride', month, envelopeId: food },
    ] satisfies TZerroIntent[])
      expect(
        applyPatch(
          original,
          materializeCommand(original, issue(original, intent))
        )
      ).toEqual(original)
  })
})
