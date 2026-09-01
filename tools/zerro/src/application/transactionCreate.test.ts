// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { makeDemoStore } from '@/zerro-core/demo'
import { buildOutboxTransport } from '@/zerro-core/headless'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import { listOutbox } from './outbox'
import {
  parseCreateTransactionRequest,
  previewCreateTransaction,
  stageCreateTransaction,
} from './transactionCreate'
import { loadWorkspace, saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []
let context: TToolContext
let accountIds: { first: string; secondSameInstrument: string; cross: string }
let tagId: string
let merchantId: string

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-transaction-'))
  directories.push(directory)
  context = {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
  const base = makeDemoStore({ until: '2023-06-19' })
  const accounts = Object.values(base.account).filter(
    account => account.type !== 'debt'
  )
  const first = accounts[0]
  const secondSameInstrument = accounts.find(
    account =>
      account.id !== first?.id && account.instrument === first?.instrument
  )
  const cross = accounts.find(
    account => account.instrument !== first?.instrument
  )
  const tag = Object.values(base.tag)[0]
  const merchant = Object.values(base.merchant)[0]
  if (!first || !secondSameInstrument || !cross || !tag || !merchant)
    throw new Error('Demo transaction fixture prerequisites are missing')
  accountIds = {
    first: first.id,
    secondSameInstrument: secondSameInstrument.id,
    cross: cross.id,
  }
  tagId = tag.id
  merchantId = merchant.id
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

describe('transaction creation', () => {
  it('parses only exact strict calendar-date DTOs', () => {
    expect(
      parseCreateTransactionRequest({
        kind: 'expense',
        accountId: 'cash',
        amount: 12.5,
        date: '2026-07-06',
        tagIds: ['food'],
        merchantId: null,
        payee: 'Market',
        comment: null,
      })
    ).toMatchObject({ kind: 'expense', date: '2026-07-06' })
    expect(() =>
      parseCreateTransactionRequest({
        kind: 'income',
        accountId: 'cash',
        amount: 1,
        date: '2026-02-30',
      })
    ).toThrow(/valid YYYY-MM-DD/)
    expect(() =>
      parseCreateTransactionRequest({
        kind: 'transfer',
        outcomeAccountId: 'cash',
        incomeAccountId: 'card',
        outcome: 1,
        date: '2026-07-06',
        payee: 'not allowed',
      })
    ).toThrow(/unknown key payee/)
  })

  it('previews an expense without modifying the local state file', async () => {
    const request = expenseRequest()
    const before = await readFile(context.statePath, 'utf8')

    const result = await previewCreateTransaction(context, request)

    expect(result.effect).toBe('none')
    expect(result.data).toMatchObject({
      before: null,
      balancePendingCanonicalSync: true,
      after: {
        kind: 'expense',
        income: { amount: 0 },
        outcome: { amount: 12.5, account: { id: accountIds.first } },
        tags: [{ id: tagId }],
        merchant: { id: merchantId },
      },
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('stages one idempotent transaction and retains only the primary transport entity', async () => {
    const request = expenseRequest()
    const staged = await stageCreateTransaction(context, 'expense-1', request)
    expect(staged.effect).toBe('local')
    expect(staged.data.idempotent).toBe(false)
    expect(staged.data.receipt).toMatchObject({
      transactionId: expect.any(String),
      outboxPosition: 1,
    })
    const transactionId = staged.data.receipt.transactionId
    if (typeof transactionId !== 'string')
      throw new Error('Transaction receipt id must be a string')

    const retried = await stageCreateTransaction(context, 'expense-1', request)
    expect(retried.data).toMatchObject({ idempotent: true })
    const saved = await loadWorkspace(context, 'fixture')
    expect(saved.state.outbox).toHaveLength(1)
    expect(saved.current.transaction[transactionId]).toMatchObject({
      id: transactionId,
      income: 0,
      outcome: 12.5,
      outcomeAccount: accountIds.first,
    })

    const outbox = await listOutbox(context, {})
    expect(outbox.data.items[0]).toMatchObject({
      summary: 'transaction creation',
    })
    expect(outbox.data.items[0]).not.toHaveProperty('patch')

    const transport = buildOutboxTransport(
      saved.state.base,
      saved.state.outbox,
      context.now()
    )
    expect(transport?.transaction).toEqual([
      expect.objectContaining({ id: transactionId, outcome: 12.5 }),
    ])
    expect(transport?.deletion).toBeUndefined()
  })

  it('uses Core transfer rules for same and cross-instrument amounts', async () => {
    const same = await previewCreateTransaction(context, {
      kind: 'transfer',
      outcomeAccountId: accountIds.first,
      incomeAccountId: accountIds.secondSameInstrument,
      outcome: 20,
      date: '2026-07-06',
    })
    expect(same.data.after).toMatchObject({
      kind: 'transfer',
      outcome: { amount: 20 },
      income: { amount: 20 },
    })

    await expect(
      previewCreateTransaction(context, {
        kind: 'transfer',
        outcomeAccountId: accountIds.first,
        incomeAccountId: accountIds.cross,
        outcome: 20,
        date: '2026-07-06',
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })

    const cross = await previewCreateTransaction(context, {
      kind: 'transfer',
      outcomeAccountId: accountIds.first,
      incomeAccountId: accountIds.cross,
      outcome: 20,
      income: 5,
      date: '2026-07-06',
    })
    expect(cross.data.after).toMatchObject({
      outcome: { amount: 20 },
      income: { amount: 5 },
    })
  })

  it('rejects missing references and same-account transfers before persistence', async () => {
    const before = await readFile(context.statePath, 'utf8')
    await expect(
      previewCreateTransaction(context, {
        kind: 'expense',
        accountId: 'missing',
        amount: 1,
        date: '2026-07-06',
      })
    ).rejects.toMatchObject({ code: 'ENTITY_NOT_FOUND' })
    await expect(
      previewCreateTransaction(context, {
        kind: 'transfer',
        outcomeAccountId: accountIds.first,
        incomeAccountId: accountIds.first,
        outcome: 1,
        date: '2026-07-06',
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })
})

function expenseRequest() {
  return {
    kind: 'expense' as const,
    accountId: accountIds.first,
    amount: 12.5,
    date: '2026-07-06',
    tagIds: [tagId],
    merchantId,
    payee: 'Market',
    comment: 'Lunch',
  }
}
