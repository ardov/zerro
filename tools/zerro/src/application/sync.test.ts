// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { convertDiff } from '6-shared/api/zm-adapter/converters'
import { makeDemoStore } from 'zerro-core/demo'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TToolContext } from './context'
import { sync } from './sync'
import { stageCreateTransaction } from './transactionCreate'
import { loadWorkspace, saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []
let context: TToolContext
let accountId: string

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-sync-'))
  directories.push(directory)
  context = {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: { ZERRO_TOKEN: 'secret' },
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
  const base = makeDemoStore({ until: '2023-06-19' })
  const account = Object.values(base.account).find(item => item.type !== 'debt')
  if (!account) throw new Error('Demo sync fixture requires an account')
  accountId = account.id
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

describe('explicit sync', () => {
  it('returns a no-network success when the outbox is empty', async () => {
    const fetchMock = vi.fn()
    const result = await sync(context, { fetch: fetchMock, now: context.now })

    expect(result).toMatchObject({
      effect: 'remote',
      data: { sentOutboxCount: 0, noOp: true },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires a token only when there is staged intent', async () => {
    await stageExpense()
    const noTokenContext = { ...context, env: {} }
    const before = await readFile(context.statePath, 'utf8')

    await expect(sync(noTokenContext)).rejects.toMatchObject({
      code: 'TOKEN_REQUIRED',
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('sends only the primary transport, accepts the sent prefix, and persists canonical data', async () => {
    const transactionId = await stageExpense()
    const staged = await loadWorkspace(context, 'fixture')
    const canonical = convertDiff.toServer({
      serverTimestamp: 2_000_000_000_000,
      transaction: [staged.current.transaction[transactionId]],
    })
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body))
        expect(body.transaction).toEqual([
          expect.objectContaining({ id: transactionId, outcome: 12.5 }),
        ])
        expect(body.deletion).toBeUndefined()
        return new Response(JSON.stringify(canonical), { status: 200 })
      }
    )

    const result = await sync(context, {
      fetch: fetchMock as typeof fetch,
      now: context.now,
    })

    expect(result).toMatchObject({
      effect: 'remote',
      data: { sentOutboxCount: 1, pendingCommandCount: 0, noOp: false },
    })
    expect(result.warnings).toBeUndefined()
    const accepted = await loadWorkspace(context, 'fixture')
    expect(accepted.state.outbox).toEqual([])
    expect(accepted.state.base.transaction[transactionId]).toMatchObject({
      id: transactionId,
      outcome: 12.5,
    })
  })

  it('preserves staged intent on uncertain transport/server failures', async () => {
    await stageExpense()
    const before = await readFile(context.statePath, 'utf8')

    await expect(
      sync(context, {
        fetch: vi.fn(async () => {
          throw new Error('offline')
        }) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_FAILURE',
      outcome: 'unknown',
      retryable: false,
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)

    await expect(
      sync(context, {
        fetch: vi.fn(
          async () => new Response('server error', { status: 500 })
        ) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({
      code: 'ZENMONEY_REJECTED',
      outcome: 'unknown',
      retryable: false,
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)

    await expect(
      sync(context, {
        fetch: vi.fn(
          async () => new Response('not JSON', { status: 200 })
        ) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({
      code: 'INVALID_ZENMONEY_RESPONSE',
      outcome: 'unknown',
      retryable: false,
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('reports explicit 4xx rejection as not applied and warns on a missing canonical transaction', async () => {
    await stageExpense()
    const before = await readFile(context.statePath, 'utf8')
    await expect(
      sync(context, {
        fetch: vi.fn(
          async () => new Response('invalid request', { status: 400 })
        ) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({
      code: 'ZENMONEY_REJECTED',
      outcome: 'not_applied',
      retryable: false,
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)

    const result = await sync(context, {
      fetch: vi.fn(
        async () =>
          new Response(JSON.stringify({ serverTimestamp: 2_000_000_000 }), {
            status: 200,
          })
      ) as typeof fetch,
      now: context.now,
    })
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'CANONICAL_TRANSACTION_MISSING' }),
    ])
    expect((await loadWorkspace(context, 'fixture')).state.outbox).toEqual([])
  })
})

async function stageExpense(): Promise<string> {
  const result = await stageCreateTransaction(context, 'sync-expense-1', {
    kind: 'expense',
    accountId,
    amount: 12.5,
    date: '2026-07-06',
  })
  const transactionId = result.data.receipt.transactionId
  if (typeof transactionId !== 'string')
    throw new Error('Transaction receipt id must be a string')
  return transactionId
}
