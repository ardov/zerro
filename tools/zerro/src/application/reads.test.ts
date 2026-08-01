// @vitest-environment node

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createEmptyDataStore,
  issuePatch,
  type TDataStore,
} from 'zerro-core/headless'
import { makeDemoStore } from 'zerro-core/demo'
import { afterEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import { listAccounts, searchTags, searchTransactions } from './reads'
import { saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('bounded local reads', () => {
  it('reads replayed current state and binds cursors to the revision', async () => {
    const context = await makeContext()
    const base = createEmptyDataStore()
    base.instrument[1] = {
      id: 1,
      changed: 1,
      title: 'Czech koruna',
      shortTitle: 'CZK',
      symbol: 'Kč',
      rate: 1,
    }
    base.account.a = makeAccount('a', 'Alpha')
    base.account.b = makeAccount('b', 'Beta')
    const command = issuePatch(
      base,
      { account: [{ id: 'b', title: 'Aardvark' }] },
      2
    )
    await saveWorkspace(
      context.statePath,
      {
        version: 1,
        endpoint: 'ru',
        base,
        outbox: [command],
        recentRequests: [],
      },
      'fixture'
    )

    const first = await listAccounts(context, { limit: '1' })
    expect(first.data.items[0]).toMatchObject({
      id: 'b',
      title: 'Aardvark',
      hasPendingChanges: true,
    })
    expect(first.data.nextCursor).not.toBeNull()
    const second = await listAccounts(context, {
      limit: '1',
      cursor: first.data.nextCursor ?? undefined,
    })
    expect(second.data.items[0].id).toBe('a')
    await expect(
      searchTags(context, { cursor: first.data.nextCursor ?? undefined })
    ).rejects.toMatchObject({ code: 'INVALID_CURSOR' })
  })

  it('resolves --account by exact id, exact title, or case-insensitive title', async () => {
    const context = await makeContext()
    const base = createEmptyDataStore()
    base.instrument[1] = {
      id: 1,
      changed: 1,
      title: 'Czech koruna',
      shortTitle: 'CZK',
      symbol: 'Kč',
      rate: 1,
    }
    base.account.a = makeAccount('a', 'Alpha')
    await saveWorkspace(
      context.statePath,
      { version: 1, endpoint: 'ru', base, outbox: [], recentRequests: [] },
      'fixture'
    )

    await expect(
      searchTransactions(context, { account: 'a' })
    ).resolves.toMatchObject({ data: { returned: 0 } })
    await expect(
      searchTransactions(context, { account: 'Alpha' })
    ).resolves.toMatchObject({ data: { returned: 0 } })
    await expect(
      searchTransactions(context, { account: 'alpha' })
    ).resolves.toMatchObject({ data: { returned: 0 } })
    await expect(
      searchTransactions(context, { account: 'nonexistent' })
    ).rejects.toMatchObject({
      code: 'ENTITY_NOT_FOUND',
      details: { accountId: 'nonexistent' },
    })
  })

  it('hides archived accounts by default and totals net worth by inBalance', async () => {
    const context = await makeContext()
    const base = createEmptyDataStore()
    base.instrument[1] = {
      id: 1,
      changed: 1,
      title: 'Czech koruna',
      shortTitle: 'CZK',
      symbol: 'Kč',
      rate: 1,
    }
    base.account.a = { ...makeAccount('a', 'Alpha'), balance: 100 }
    base.account.b = {
      ...makeAccount('b', 'Beta'),
      balance: 50,
      inBalance: false,
      archive: true,
    }
    await saveWorkspace(
      context.statePath,
      { version: 1, endpoint: 'ru', base, outbox: [], recentRequests: [] },
      'fixture'
    )

    const visible = await listAccounts(context, { limit: '10' })
    expect(visible.data.includeArchived).toBe(false)
    expect(visible.data.items.map(item => item.id)).toEqual(['a'])
    expect(visible.data.totals.netWorth).toEqual({ CZK: 100 })
    expect(visible.data.totals.inBudget).toEqual({ CZK: 100 })
    expect(visible.data.totals.offBudget).toEqual({})

    const withArchived = await listAccounts(context, {
      limit: '10',
      'include-archived': true,
    } as unknown as Parameters<typeof listAccounts>[1])
    expect(withArchived.data.items.map(item => item.id).sort()).toEqual([
      'a',
      'b',
    ])
    expect(withArchived.data.totals.netWorth).toEqual({ CZK: 150 })
    expect(withArchived.data.totals.offBudget).toEqual({ CZK: 50 })
  })

  it('converts account balances and totals when --display-currency is set', async () => {
    const context = await makeContext()
    const base = createEmptyDataStore()
    base.instrument[1] = {
      id: 1,
      changed: 1,
      title: 'Czech koruna',
      shortTitle: 'CZK',
      symbol: 'Kč',
      rate: 2,
    }
    base.instrument[2] = {
      id: 2,
      changed: 1,
      title: 'Russian ruble',
      shortTitle: 'RUB',
      symbol: '₽',
      rate: 1,
    }
    base.account.a = { ...makeAccount('a', 'Alpha'), balance: 100 }
    await saveWorkspace(
      context.statePath,
      { version: 1, endpoint: 'ru', base, outbox: [], recentRequests: [] },
      'fixture'
    )

    const result = await listAccounts(context, {
      limit: '10',
      'display-currency': 'RUB',
    })
    expect(result.data.items[0].balanceConverted).toBe(200)
    expect(result.data.totals.netWorthConverted).toBe(200)
  })
})

describe('transaction --type filter and totals', () => {
  it('filters by type and totals split evenly across all types', async () => {
    const context = await makeContext()
    const demo = makeDemoStore({ until: '2023-06-19' })
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

    const [outcomeOnly, incomeOnly, transferOnly, all] = await Promise.all([
      searchTransactions(context, { type: 'outcome', limit: '1' }),
      searchTransactions(context, { type: 'income', limit: '1' }),
      searchTransactions(context, { type: 'transfer', limit: '1' }),
      searchTransactions(context, { limit: '1' }),
    ])
    expect(outcomeOnly.data.totalCount).toBeGreaterThan(0)
    expect(
      outcomeOnly.data.totalCount +
        incomeOnly.data.totalCount +
        transferOnly.data.totalCount
    ).toBe(all.data.totalCount)
  })

  it('computes income/outcome totals, converted when --display-currency is set', async () => {
    const context = await makeContext()
    const demo = makeDemoStore({ until: '2023-06-19' })
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

    const result = await searchTransactions(context, {
      type: 'outcome',
      limit: '1',
      'display-currency': 'RUB',
    })
    expect(result.data.displayCurrency).toBe('RUB')
    expect(Object.keys(result.data.totals.outcome).length).toBeGreaterThan(0)
    expect(result.data.totals.income).toEqual({})
    expect(result.data.totals.outcomeConverted).toEqual(expect.any(Number))
  })

  it('rejects an unknown --type value', async () => {
    const context = await makeContext()
    const demo = makeDemoStore({ until: '2023-06-19' })
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
    await expect(
      searchTransactions(context, { type: 'bogus' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })
})

async function makeContext(): Promise<TToolContext> {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-reads-'))
  directories.push(directory)
  return {
    now: () => Date.parse('2026-07-29T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
}

function makeAccount(id: string, title: string): TDataStore['account'][string] {
  return {
    id,
    changed: 1,
    user: 1,
    instrument: 1,
    title,
    role: null,
    company: null,
    type: 'cash' as TDataStore['account'][string]['type'],
    syncID: null,
    balance: 100,
    startBalance: 100,
    creditLimit: 0,
    inBalance: true,
    savings: false,
    enableCorrection: false,
    balanceCorrectionType: null,
    enableSMS: false,
    archive: false,
    private: false,
    capitalization: null,
    percent: null,
    startDate: null,
    endDateOffset: null,
    endDateOffsetInterval: null,
    payoffStep: null,
    payoffInterval: null,
  }
}
