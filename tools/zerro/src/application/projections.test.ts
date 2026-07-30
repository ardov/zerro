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
  listMonths,
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

    const coreTotals = session.months.getTotals()[month]
    // The tool exposes the positive and net allocation totals separately.
    expect(result.data.totals).toEqual({
      ...coreTotals,
      assigned: coreTotals.positiveAssigned,
      assignedNet: coreTotals.assigned,
      undistributedIncome: expect.any(Object),
    })
    expect(result.data.envelopes.envelopeCount).toBe(
      Object.keys(session.envelopes.getAll()).length
    )
    expect(result.data.envelopes.transactionCount).toBeGreaterThanOrEqual(0)
    expectFiniteNumbers(result.data)
  })

  it('reports undistributed income separately from assigned allocations', async () => {
    const result = await getMonth(context, '2026-07')
    expect(result.data.totals.undistributedIncome).toEqual(expect.any(Object))
    // Every currency the user's income envelopes are still holding must be
    // non-negative until the user allocates it.
    Object.values(result.data.totals.undistributedIncome).forEach(amount => {
      expect(amount).toBeGreaterThanOrEqual(0)
    })
  })

  it('converts month totals into the requested display currency', async () => {
    const month = '2026-07'
    const result = await getMonth(context, month, {
      'display-currency': 'RUB',
    })

    expect(result.data.displayCurrency).toBe('RUB')
    expect(result.data.totalsConverted).toMatchObject({
      fundsStart: expect.any(Number),
      toBeAssigned: expect.any(Number),
    })
    // RUB is the base currency (rate 1), so a RUB-only vector converts to itself.
    expect(result.data.totalsConverted?.overspend).toBeCloseTo(
      result.data.totals.overspend.RUB ?? 0,
      2
    )
  })

  it('rejects an unknown --display-currency code', async () => {
    await expect(
      getMonth(context, '2026-07', { 'display-currency': 'ZZZ' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('lists months in a range and matches month get for each one', async () => {
    const listed = await listMonths(context, {
      from: '2026-01',
      to: '2026-07',
      limit: '200',
    })
    expect(listed.data.items.map(item => item.month)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
    ])
    const single = await getMonth(context, '2026-04')
    const matching = listed.data.items.find(item => item.month === '2026-04')
    expect(matching).toEqual(single.data)
  })

  it('rejects --from after --to for months list', async () => {
    await expect(
      listMonths(context, { from: '2026-07', to: '2026-01' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('paginates months list and converts each month when requested', async () => {
    const page = await listMonths(context, {
      from: '2026-01',
      to: '2026-07',
      limit: '3',
      'display-currency': 'RUB',
    })
    expect(page.data.items).toHaveLength(3)
    expect(page.data.displayCurrency).toBe('RUB')
    expect(page.data.nextCursor).not.toBeNull()
    for (const item of page.data.items) {
      expect(item.totalsConverted).toBeDefined()
    }
  })

  it('lists and gets bounded envelope metrics for one month', async () => {
    const listed = await listEnvelopes(context, {
      month: '2026-07',
      limit: '5',
    })
    expect(listed.data.returned).toBe(5)
    expect(listed.data.totalCount).toBeGreaterThan(5)
    expect(listed.data.nextCursor).not.toBeNull()
    expect(listed.data.items[0]).toMatchObject({
      id: expect.any(String),
      self: {
        assignedByCurrency: expect.any(Object),
        activityByCurrency: expect.any(Object),
        availableByCurrency: expect.any(Object),
        transactionCount: expect.any(Number),
      },
      withChildren: {
        assignedByCurrency: expect.any(Object),
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

  it('exposes keepIncome so callers can tell a refund from general income', async () => {
    const listed = await listEnvelopes(context, {
      month: '2026-07',
      limit: '200',
    })
    expect(listed.data.items.length).toBeGreaterThan(0)
    for (const item of listed.data.items) {
      expect(typeof item.keepIncome).toBe('boolean')
    }
    const selected = await getEnvelope(context, listed.data.items[0].id, {
      month: '2026-07',
    })
    expect(selected.data.keepIncome).toBe(listed.data.items[0].keepIncome)
  })

  it('adds converted scalars to envelope rows when --display-currency is set', async () => {
    const listed = await listEnvelopes(context, {
      month: '2026-07',
      limit: '5',
      'display-currency': 'RUB',
    })
    expect(listed.data.displayCurrency).toBe('RUB')
    for (const item of listed.data.items) {
      expect(item.self.converted).toMatchObject({
        assigned: expect.any(Number),
        activity: expect.any(Number),
        available: expect.any(Number),
      })
      expect(item.withChildren.converted).toMatchObject({
        assigned: expect.any(Number),
        activity: expect.any(Number),
        available: expect.any(Number),
      })
    }
  })

  it('marks root envelopes and filters to them with --roots-only', async () => {
    const all = await listEnvelopes(context, {
      month: '2026-07',
      limit: '200',
    })
    expect(all.data.items.some(item => item.isRoot)).toBe(true)
    expect(all.data.items.some(item => !item.isRoot)).toBe(true)

    const roots = await listEnvelopes(context, {
      month: '2026-07',
      limit: '200',
      'roots-only': true,
    } as unknown as Parameters<typeof listEnvelopes>[1])
    expect(roots.data.items.length).toBeGreaterThan(0)
    expect(roots.data.items.every(item => item.isRoot)).toBe(true)
    expect(roots.data.totalCount).toBeLessThan(all.data.totalCount)
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

  it('converts goal totals into the requested display currency', async () => {
    const goals = await listGoals(context, {
      month: '2026-07',
      limit: '10',
      'display-currency': 'RUB',
    })
    expect(goals.data.displayCurrency).toBe('RUB')
    expect(goals.data.totalsConverted).toMatchObject({
      need: expect.any(Number),
      target: expect.any(Number),
    })
  })

  it('caps representative large-fixture pages at 200 rows', async () => {
    expect(Object.keys(demo.transaction).length).toBeGreaterThan(200)
    const page = await searchTransactions(context, { limit: '200' })
    expect(page.data.returned).toBe(200)
    expect(page.data.items).toHaveLength(200)
    expect(page.data.totalCount).toBeGreaterThan(200)
    await expect(
      searchTransactions(context, { limit: '201' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('filters transactions by --tag and --merchant, resolving names as well as ids', async () => {
    const sample = Object.values(demo.transaction).find(
      transaction => transaction.tag?.length && transaction.merchant
    )
    if (!sample)
      throw new Error('fixture needs a transaction with a tag and a merchant')
    const tagId = sample.tag?.[0]
    const merchantId = sample.merchant
    if (!tagId || !merchantId) throw new Error('unreachable')

    const byTag = await searchTransactions(context, {
      tag: tagId,
      limit: '200',
    })
    expect(byTag.data.items.length).toBeGreaterThan(0)
    expect(
      byTag.data.items.every(item => item.tags.some(t => t.id === tagId))
    ).toBe(true)

    const byMerchant = await searchTransactions(context, {
      merchant: merchantId,
      limit: '200',
    })
    expect(byMerchant.data.items.length).toBeGreaterThan(0)
    expect(
      byMerchant.data.items.every(item => item.merchant?.id === merchantId)
    ).toBe(true)

    const tagTitle = demo.tag[tagId]?.title
    const byTagName = await searchTransactions(context, {
      tag: tagTitle,
      limit: '200',
    })
    expect(byTagName.data.totalCount).toBe(byTag.data.totalCount)

    await expect(
      searchTransactions(context, { tag: 'nonexistent-tag' })
    ).rejects.toMatchObject({
      code: 'ENTITY_NOT_FOUND',
      details: { tagId: 'nonexistent-tag' },
    })
    await expect(
      searchTransactions(context, { merchant: 'nonexistent-merchant' })
    ).rejects.toMatchObject({
      code: 'ENTITY_NOT_FOUND',
      details: { merchantId: 'nonexistent-merchant' },
    })
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
