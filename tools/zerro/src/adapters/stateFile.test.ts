// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import {
  createEmptyDataStore,
  issuePatch,
  type TDataStore,
} from '@/zerro-core/headless'
import { afterEach, describe, expect, it } from 'vitest'

import type { TToolContext } from '../application/context'
import {
  addRecentRequest,
  findRecentRequest,
  loadWorkspace,
  saveWorkspace,
  stateRevision,
  type TLocalToolState,
} from './stateFile'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('local tool state file', () => {
  it('bootstraps without writing, then atomically saves private base + outbox', async () => {
    const context = await makeContext()
    const absent = await loadWorkspace(context, 'status')
    expect(absent.exists).toBe(false)

    const base = createEmptyDataStore()
    base.account.cash = makeAccount()
    const command = issuePatch(
      base,
      { account: [{ id: 'cash', title: 'Wallet' }] },
      1_000
    )
    const state: TLocalToolState = {
      ...absent.state,
      base,
      outbox: [command],
    }
    await saveWorkspace(context.statePath, state, 'test save')

    const loaded = await loadWorkspace(context, 'status')
    expect(loaded.current.account.cash.title).toBe('Wallet')
    expect(
      JSON.parse(await readFile(context.statePath, 'utf8'))
    ).not.toHaveProperty('current')
    expect((await stat(context.statePath)).mode & 0o777).toBe(0o600)
    expect((await stat(dirname(context.statePath))).mode & 0o777).toBe(0o700)
  })

  it('rejects malformed state, endpoint conflicts, and request id reuse', async () => {
    const context = await makeContext()
    await writeState(context, { version: 2 })
    await expect(loadWorkspace(context, 'status')).rejects.toMatchObject({
      code: 'INVALID_STATE',
    })

    const clean = emptyState()
    await saveWorkspace(context.statePath, clean, 'test save')
    await expect(
      loadWorkspace(
        { ...context, endpoint: 'app', endpointExplicit: true },
        'status'
      )
    ).rejects.toMatchObject({ code: 'ENDPOINT_MISMATCH' })

    const recorded = addRecentRequest(clean, {
      requestId: 'budget:1',
      command: 'budget stage-set',
      normalizedInput: { month: '2026-07', value: 10 },
      completedAt: 1,
      receipt: { commandCount: 1 },
    })
    expect(
      findRecentRequest(recorded, {
        requestId: 'budget:1',
        command: 'budget stage-set',
        normalizedInput: { value: 10, month: '2026-07' },
      })?.receipt
    ).toEqual({ commandCount: 1 })
    expect(() =>
      findRecentRequest(recorded, {
        requestId: 'budget:1',
        command: 'budget stage-set',
        normalizedInput: { month: '2026-07', value: 11 },
      })
    ).toThrow('different input')
  })

  it('keeps semantic revision independent from recent request receipts', () => {
    const clean = emptyState()
    const recorded = addRecentRequest(clean, {
      requestId: 'request-1',
      command: 'outbox undo',
      normalizedInput: {},
      completedAt: 1,
      receipt: { undone: true },
    })
    expect(stateRevision(recorded)).toBe(stateRevision(clean))

    const bounded = Array.from({ length: 33 }).reduce<TLocalToolState>(
      (state, _, index) =>
        addRecentRequest(state, {
          requestId: `request-${index}`,
          command: 'outbox undo',
          normalizedInput: { index },
          completedAt: index,
          receipt: { undone: true },
        }),
      clean
    )
    expect(bounded.recentRequests).toHaveLength(32)
    expect(bounded.recentRequests[0].requestId).toBe('request-1')
  })

  it('does not replace anything when the atomic write cannot start', async () => {
    const context = await makeContext()
    const blocker = join(dirname(context.statePath), 'blocker')
    await mkdir(dirname(blocker), { recursive: true })
    await writeFile(blocker, 'keep')

    await expect(
      saveWorkspace(join(blocker, 'state.json'), emptyState(), 'test save')
    ).rejects.toMatchObject({ code: 'STATE_WRITE_FAILED' })
    expect(await readFile(blocker, 'utf8')).toBe('keep')
  })
})

async function makeContext(): Promise<TToolContext> {
  const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-'))
  directories.push(directory)
  return {
    now: () => Date.parse('2026-07-29T12:00:00.000Z'),
    env: {},
    statePath: join(directory, 'private', 'state.json'),
    endpoint: 'ru',
    endpointExplicit: false,
  }
}

function emptyState(): TLocalToolState {
  return {
    version: 1,
    endpoint: 'ru',
    base: createEmptyDataStore(),
    outbox: [],
    recentRequests: [],
  }
}

async function writeState(
  context: TToolContext,
  value: unknown
): Promise<void> {
  const directory = dirname(context.statePath)
  await mkdir(directory, { recursive: true })
  await writeFile(context.statePath, JSON.stringify(value))
}

function makeAccount(): TDataStore['account'][string] {
  return {
    id: 'cash',
    changed: 1,
    user: 1,
    instrument: 1,
    title: 'Cash',
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
