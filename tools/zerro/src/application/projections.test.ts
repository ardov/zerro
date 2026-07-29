// @vitest-environment node

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { makeDemoStore } from 'zerro-core/demo'
import { createZerroSession } from 'zerro-core/headless'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import {
  getEnvelope,
  getMonth,
  listDebtors,
  listEnvelopes,
  listGoals,
} from './projections'
import { searchTransactions } from './reads'
import { saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []
let context: TToolContext
let demo: ReturnType<typeof makeDemoStore>

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-projections-'))
  directories.push(directory)
  context = {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
  demo = makeDemoStore({ until: '2023-06-19' })
  addDebtorFixture(demo)
  await saveWorkspace(
    context.statePath,
    {
      version: 1,
      endpoint: 'ru',
      base: demo,
      outbox: [],
      recentRequests: [],
    },
    'fixture'
  )
})

function addDebtorFixture(store: ReturnType<typeof makeDemoStore>): void {
  const seed = Object.values(store.transaction)[0]
  const debtAccount = Object.values(store.account).find(
    account => account.type === 'debt'
  )
  const ordinaryAccount = Object.values(store.account).find(
    account => account.type !== 'debt'
  )
  const merchant = Object.values(store.merchant).find(
    item => item.title === 'Alex'
  )
  if (!seed || !debtAccount || !ordinaryAccount || !merchant)
    throw new Error('Demo debtor fixture prerequisites are missing')
  store.transaction['debt-fixture'] = {
    ...seed,
    id: 'debt-fixture',
    date: '2023-06-01',
    deleted: false,
    incomeAccount: debtAccount.id,
    incomeInstrument: debtAccount.instrument,
    income: 0,
    outcomeAccount: ordinaryAccount.id,
    outcomeInstrument: ordinaryAccount.instrument,
    outcome: 100,
    merchant: merchant.id,
    payee: null,
  }
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('finance projection reads', () => {
  it('formats month totals directly from the immutable Core session', async () => {
    const month = '2026-07'
    const result = await getMonth(context, month)
    const session = createZerroSession(demo, {
      now: context.now,
      uuid: () => 'test',
    })

    expect(result.data.totals).toEqual(session.months.getTotals()[month])
    expect(result.data.envelopes.envelopeCount).toBe(
      Object.keys(session.envelopes.getAll()).length
    )
    expect(result.data.envelopes.transactionCount).toBeGreaterThanOrEqual(0)
    expectFiniteNumbers(result.data)
  })

  it('lists and gets bounded envelope metrics for one month', async () => {
    const listed = await listEnvelopes(context, {
      month: '2026-07',
      limit: '5',
    })
    expect(listed.data.returned).toBe(5)
    expect(listed.data.nextCursor).not.toBeNull()
    expect(listed.data.items[0]).toMatchObject({
      id: expect.any(String),
      self: {
        budgetByCurrency: expect.any(Object),
        activityByCurrency: expect.any(Object),
        availableByCurrency: expect.any(Object),
        transactionCount: expect.any(Number),
      },
      withChildren: {
        budgetByCurrency: expect.any(Object),
        activityByCurrency: expect.any(Object),
        availableByCurrency: expect.any(Object),
        transactionCount: expect.any(Number),
      },
    })

    const selected = await getEnvelope(context, listed.data.items[0].id, {
      month: '2026-07',
    })
    expect(selected.data).toEqual(listed.data.items[0])
    expectFiniteNumbers(listed.data)
  })

  it('keeps goal and debtor outputs compact and free of raw transactions', async () => {
    const goals = await listGoals(context, {
      month: '2026-07',
      limit: '10',
    })
    expect(goals.data.totals).toMatchObject({
      goalsCount: expect.any(Number),
      progress: expect.any(Number),
    })

    const debtors = await listDebtors(context, { limit: '10' })
    expect(debtors.data.returned).toBeGreaterThan(0)
    expect(debtors.data.items[0]).toMatchObject({
      id: expect.any(String),
      balance: expect.any(Object),
      transactionCount: expect.any(Number),
    })
    expect(debtors.data.items[0]).not.toHaveProperty('transactions')
    expectFiniteNumbers(goals.data)
    expectFiniteNumbers(debtors.data)
  })

  it('caps representative large-fixture pages at 200 rows', async () => {
    expect(Object.keys(demo.transaction).length).toBeGreaterThan(200)
    const page = await searchTransactions(context, { limit: '200' })
    expect(page.data.returned).toBe(200)
    expect(page.data.items).toHaveLength(200)
    await expect(
      searchTransactions(context, { limit: '201' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects invalid, unavailable, and mismatched projection references', async () => {
    await expect(getMonth(context, '2026-13')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
    await expect(getMonth(context, '1999-01')).rejects.toMatchObject({
      code: 'MONTH_NOT_FOUND',
    })
    await expect(
      getEnvelope(context, 'tag#missing', { month: '2026-07' })
    ).rejects.toMatchObject({ code: 'ENTITY_NOT_FOUND' })
  })

  it('rejects uninitialized financial projections instead of emitting NaN', async () => {
    const emptyContext = await makeEmptyContext()
    await expect(getMonth(emptyContext, '2026-07')).rejects.toMatchObject({
      code: 'STATE_NOT_INITIALIZED',
      exitCode: 4,
    })
  })
})

async function makeEmptyContext(): Promise<TToolContext> {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-empty-'))
  directories.push(directory)
  return {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
}

function expectFiniteNumbers(value: unknown): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true)
    return
  }
  if (Array.isArray(value)) {
    value.forEach(expectFiniteNumbers)
    return
  }
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(expectFiniteNumbers)
  }
}
