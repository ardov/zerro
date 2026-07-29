// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { makeDemoStore } from 'zerro-core/demo'
import { createZerroSession } from 'zerro-core/headless'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import {
  parseSetEnvelopeBudgetsRequest,
  previewSetEnvelopeBudgets,
  stageSetEnvelopeBudgets,
} from './budgetSet'
import { getEnvelope } from './projections'
import { listOutbox, undoLastOutboxCommand } from './outbox'
import { loadWorkspace, saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []
let context: TToolContext
let envelope: { id: string; currency: string }

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-budget-set-'))
  directories.push(directory)
  context = {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
  const base = makeDemoStore({ until: '2023-06-19' })
  const session = createZerroSession(base, {
    now: context.now,
    uuid: () => 'fixture',
  })
  const selected = Object.values(session.envelopes.getAll()).find(
    item => item.type === 'tag'
  )
  if (!selected) throw new Error('Demo fixture must contain a tag envelope')
  envelope = { id: selected.id, currency: selected.currency }
  await saveWorkspace(
    context.statePath,
    {
      version: 1,
      endpoint: 'ru',
      base,
      outbox: [],
      recentRequests: [],
    },
    'fixture'
  )
})

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('envelope budget updates', () => {
  it('parses only the exact bounded set/clear DTO', () => {
    expect(
      parseSetEnvelopeBudgetsRequest({
        month: '2026-07',
        updates: [
          {
            envelopeId: 'tag#food',
            operation: 'set',
            amount: 123,
            currency: 'CZK',
          },
          { envelopeId: 'tag#rent', operation: 'clear' },
        ],
      })
    ).toEqual({
      month: '2026-07',
      updates: [
        {
          envelopeId: 'tag#food',
          operation: 'set',
          amount: 123,
          currency: 'CZK',
        },
        { envelopeId: 'tag#rent', operation: 'clear' },
      ],
    })
    expect(() =>
      parseSetEnvelopeBudgetsRequest({
        month: '2026-07',
        updates: [{ envelopeId: 'tag#food', operation: 'clear', amount: 0 }],
      })
    ).toThrow(/unknown key amount/)
    expect(() =>
      parseSetEnvelopeBudgetsRequest({
        month: '2026-07',
        updates: [
          {
            envelopeId: 'tag#food',
            operation: 'set',
            amount: 1,
            currency: 'CZK',
          },
          {
            envelopeId: 'tag#food',
            operation: 'set',
            amount: 2,
            currency: 'CZK',
          },
        ],
      })
    ).toThrow(/unique envelopeId/)
  })

  it('previews without modifying the persisted state', async () => {
    const request = budgetRequest()
    const before = await readFile(context.statePath, 'utf8')

    const result = await previewSetEnvelopeBudgets(context, request)

    expect(result.effect).toBe('none')
    expect(result.data.affected).toHaveLength(1)
    expect(result.data.affected[0]).toMatchObject({
      envelopeId: envelope.id,
      operation: 'set',
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('stages one idempotent command, exposes it without raw patches, and undoes it', async () => {
    const request = budgetRequest()
    const original = await loadWorkspace(context, 'fixture')

    const staged = await stageSetEnvelopeBudgets(
      context,
      'july-budget-1',
      request
    )
    expect(staged.effect).toBe('local')
    expect(staged.data.idempotent).toBe(false)
    expect(staged.data.receipt).toEqual({
      outboxPosition: 1,
      affectedEnvelopeCount: 1,
    })
    expect((await loadWorkspace(context, 'fixture')).state.outbox).toHaveLength(
      1
    )

    const retried = await stageSetEnvelopeBudgets(
      context,
      'july-budget-1',
      request
    )
    expect(retried.data).toMatchObject({ idempotent: true })
    expect((await loadWorkspace(context, 'fixture')).state.outbox).toHaveLength(
      1
    )

    const changedEnvelope = await getEnvelope(context, envelope.id, {
      month: request.month,
    })
    expect(changedEnvelope.meta.pendingCommandCount).toBe(1)
    expect(changedEnvelope.data.self.budgetByCurrency[envelope.currency]).toBe(
      123
    )

    const outbox = await listOutbox(context, {})
    expect(outbox.data.items).toHaveLength(1)
    expect(outbox.data.items[0]).toMatchObject({
      position: 1,
      summary: 'budget update',
    })
    expect(outbox.data.items[0]).not.toHaveProperty('patch')

    const undone = await undoLastOutboxCommand(context, 'undo-july-budget-1')
    expect(undone.data.idempotent).toBe(false)
    expect(undone.data.receipt).toEqual({
      undoneOutboxPosition: 1,
      remainingCommandCount: 0,
    })
    expect((await loadWorkspace(context, 'fixture')).revision).toBe(
      original.revision
    )
    expect(
      (await undoLastOutboxCommand(context, 'undo-july-budget-1')).data
    ).toMatchObject({ idempotent: true })
  })

  it('rejects a mismatched currency before writing local state', async () => {
    const before = await readFile(context.statePath, 'utf8')
    await expect(
      previewSetEnvelopeBudgets(context, {
        month: '2026-07',
        updates: [
          {
            envelopeId: envelope.id,
            operation: 'set',
            amount: 123,
            currency: 'not-the-envelope-currency',
          },
        ],
      })
    ).rejects.toMatchObject({ code: 'CURRENCY_MISMATCH' })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('routes preferred tag and tag#null budgets beside a hidden account budget', async () => {
    const loaded = await loadWorkspace(context, 'fixture')
    const base = loaded.state.base
    const account = Object.values(base.account).find(
      item => item.type !== 'debt'
    )
    if (!account) throw new Error('Demo fixture must contain an account')
    base.account.savings = {
      ...account,
      id: 'savings',
      title: 'Savings',
      savings: true,
      inBalance: false,
    }
    base.reminder.settings = {
      id: 'settings',
      changed: 1,
      user: Object.values(base.user)[0]?.id ?? 0,
      incomeInstrument: account.instrument,
      incomeAccount: account.id,
      income: 0,
      outcomeInstrument: account.instrument,
      outcomeAccount: account.id,
      outcome: 0,
      tag: null,
      merchant: null,
      payee: null,
      comment: JSON.stringify({
        type: 'UserSettings',
        payload: { preferZmBudgets: true },
      }),
      interval: null,
      step: 0,
      points: [0],
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      notify: false,
    }
    await saveWorkspace(context.statePath, { ...loaded.state, base }, 'fixture')
    const session = createZerroSession(base, {
      now: context.now,
      uuid: () => 'fixture',
    })
    const all = session.envelopes.getAll()
    const tag = Object.values(all).find(
      item => item.type === 'tag' && item.id !== 'tag#null'
    )
    const uncategorized = all['tag#null' as keyof typeof all]
    const savings = Object.values(all).find(
      item => item.type === 'account' && item.entityId === 'savings'
    )
    if (!tag || !uncategorized || !savings)
      throw new Error('Mixed routing fixture prerequisites are missing')

    await stageSetEnvelopeBudgets(context, 'mixed-budget-1', {
      month: '2026-07',
      updates: [
        {
          envelopeId: tag.id,
          operation: 'set',
          amount: 10,
          currency: tag.currency,
        },
        {
          envelopeId: uncategorized.id,
          operation: 'set',
          amount: 20,
          currency: uncategorized.currency,
        },
        {
          envelopeId: savings.id,
          operation: 'set',
          amount: 30,
          currency: savings.currency,
        },
      ],
    })

    const current = (await loadWorkspace(context, 'fixture')).current
    expect(Object.values(current.budget)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: tag.entityId, outcome: 10 }),
        expect.objectContaining({ tag: null, outcome: 20 }),
      ])
    )
    expect(Object.values(current.reminder)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          comment: expect.stringContaining('account#savings'),
        }),
      ])
    )
  })

  it('clears an already staged budget through the same semantic path', async () => {
    const request = budgetRequest()
    await stageSetEnvelopeBudgets(context, 'set-before-clear', request)
    await stageSetEnvelopeBudgets(context, 'clear-after-set', {
      month: request.month,
      updates: [{ envelopeId: envelope.id, operation: 'clear' }],
    })
    const result = await getEnvelope(context, envelope.id, {
      month: request.month,
    })
    expect(result.data.self.budgetByCurrency[envelope.currency] ?? 0).toBe(0)
  })
})

function budgetRequest() {
  return {
    month: '2026-07',
    updates: [
      {
        envelopeId: envelope.id,
        operation: 'set' as const,
        amount: 123,
        currency: envelope.currency,
      },
    ],
  }
}
