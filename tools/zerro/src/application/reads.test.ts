// @vitest-environment node

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createEmptyDataStore,
  issuePatch,
  type TDataStore,
} from 'zerro-core/headless'
import { afterEach, describe, expect, it } from 'vitest'

import type { TToolContext } from './context'
import { listAccounts, searchTags } from './reads'
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
      balancePendingCanonicalSync: true,
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
