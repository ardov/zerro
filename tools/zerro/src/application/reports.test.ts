// @vitest-environment node

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { makeDemoStore } from 'zerro-core/demo'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import { getActivityReport } from './reports'
import { saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []
let context: TToolContext
let demo: ReturnType<typeof makeDemoStore>

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-reports-'))
  directories.push(directory)
  context = {
    now: () => Date.parse('2026-07-06T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
  demo = makeDemoStore({ until: '2023-06-19' })
  await saveWorkspace(
    context.statePath,
    { version: 1, endpoint: 'ru', base: demo, outbox: [], recentRequests: [] },
    'fixture'
  )
})

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('activity report', () => {
  it('defaults to --direction net and groups by tag, sorted largest-first', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'tag',
      limit: '200',
    })
    expect(result.data.groupBy).toBe('tag')
    expect(result.data.direction).toBe('net')
    expect(result.data.items.length).toBeGreaterThan(0)

    const totalTransactions = result.data.items.reduce(
      (sum, item) => sum + item.transactionCount,
      0
    )
    expect(totalTransactions).toBe(result.data.totals.transactionCount)
  })

  it('sorts groups by descending absolute converted total when --display-currency is set', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'merchant',
      'display-currency': 'RUB',
      limit: '200',
    })
    expect(result.data.displayCurrency).toBe('RUB')
    const values = result.data.items.map(item =>
      Math.abs(item.totalConverted ?? 0)
    )
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i])
    }
    expect(result.data.totals.totalConverted).toEqual(expect.any(Number))
  })

  it('groups by month using YYYY-MM keys', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'month',
      limit: '200',
    })
    for (const item of result.data.items) {
      expect(item.key).toMatch(/^\d{4}-\d{2}$/)
      expect(item.name).toBe(item.key)
    }
  })

  it('groups by account using the outcome account', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'account',
      'direction': 'outcome',
      limit: '200',
    })
    for (const item of result.data.items) {
      expect(demo.account[item.key]).toBeDefined()
      expect(item.name).toBe(demo.account[item.key]?.title)
    }
  })

  it('--direction outcome reports only gross spend, always positive', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'tag',
      direction: 'outcome',
      limit: '200',
    })
    expect(result.data.items.length).toBeGreaterThan(0)
    for (const item of result.data.items) {
      for (const amount of Object.values(item.total)) {
        expect(amount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('--direction income reports only gross income, always positive', async () => {
    const result = await getActivityReport(context, {
      'group-by': 'tag',
      direction: 'income',
      limit: '200',
    })
    for (const item of result.data.items) {
      for (const amount of Object.values(item.total)) {
        expect(amount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('excludes transfer and debt movements from every direction', async () => {
    const net = await getActivityReport(context, {
      'group-by': 'tag',
      limit: '200',
    })
    const outcomeOnly = await getActivityReport(context, {
      'group-by': 'tag',
      direction: 'outcome',
      limit: '200',
    })
    const reportedCount = net.data.totals.transactionCount
    const allTransactionCount = Object.keys(demo.transaction).length
    expect(reportedCount).toBeLessThan(allTransactionCount)
    expect(reportedCount).toBeGreaterThan(0)
    expect(outcomeOnly.data.totals.transactionCount).toBeGreaterThan(0)
  })

  it('rejects an invalid --group-by value', async () => {
    await expect(
      getActivityReport(context, { 'group-by': 'bogus' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects an invalid --direction value', async () => {
    await expect(
      getActivityReport(context, { 'group-by': 'tag', direction: 'bogus' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects --from after --to', async () => {
    await expect(
      getActivityReport(context, {
        'group-by': 'tag',
        from: '2026-07-31',
        to: '2026-07-01',
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('paginates groups with a stable cursor', async () => {
    const first = await getActivityReport(context, {
      'group-by': 'merchant',
      limit: '2',
    })
    expect(first.data.items).toHaveLength(2)
    expect(first.data.nextCursor).not.toBeNull()
    const second = await getActivityReport(context, {
      'group-by': 'merchant',
      limit: '2',
      cursor: first.data.nextCursor ?? undefined,
    })
    expect(second.data.items[0].key).not.toBe(first.data.items[0].key)
  })
})
