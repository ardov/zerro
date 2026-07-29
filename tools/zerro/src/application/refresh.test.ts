// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { convertDiff } from '6-shared/api/zm-adapter/converters'
import { makeDemoDiff, makeDemoStore } from 'zerro-core/demo'
import { issuePatch } from 'zerro-core/headless'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TToolContext } from './context'
import { refresh } from './refresh'
import { loadWorkspace, saveWorkspace } from '../adapters/stateFile'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('refresh', () => {
  it('bootstraps and then uses the one-second overlap cursor', async () => {
    const context = await makeContext({ ZERRO_TOKEN: 'secret' })
    const requests: Array<Record<string, unknown>> = []
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        requests.push(JSON.parse(String(init?.body)))
        return new Response(
          JSON.stringify({
            serverTimestamp: requests.length === 1 ? 123 : 124,
          }),
          { status: 200 }
        )
      }
    )

    const first = await refresh(context, {
      fetch: fetchMock as typeof fetch,
      now: context.now,
    })
    expect(first.data.receivedServerTimestampMs).toBe(123_000)
    expect(requests[0]).toMatchObject({
      serverTimestamp: 0,
      currentClientTimestamp: 1_775_001_600,
    })

    const second = await refresh(context, {
      fetch: fetchMock as typeof fetch,
      now: context.now,
    })
    expect(second.data.cursorMs).toBe(122_000)
    expect(requests[1]).toMatchObject({ serverTimestamp: 122 })
    expect(
      (await loadWorkspace(context, 'status')).state.base.serverTimestamp
    ).toBe(124_000)
  })

  it('bootstraps a fresh state from a complete canonical fixture', async () => {
    const context = await makeContext({ ZERRO_TOKEN: 'secret' })
    const wire = convertDiff.toServer(makeDemoDiff({ until: '2022-06-19' }))
    await refresh(context, {
      fetch: vi.fn(
        async () =>
          new Response(JSON.stringify(wire), {
            status: 200,
          })
      ) as typeof fetch,
      now: context.now,
    })

    const loaded = await loadWorkspace(context, 'status')
    expect(Object.keys(loaded.state.base.account).length).toBeGreaterThan(0)
    expect(Object.keys(loaded.state.base.transaction).length).toBeGreaterThan(0)
    expect(loaded.state.outbox).toEqual([])
  })

  it('accepts canonical wire budgets without a synthetic id', async () => {
    const context = await makeContext({ ZERRO_TOKEN: 'secret' })
    await refresh(context, {
      fetch: vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              serverTimestamp: 1_800_000_000,
              budget: [
                {
                  changed: 1_800_000_000,
                  user: 1,
                  tag: null,
                  date: '2026-04-01',
                  income: 0,
                  incomeLock: false,
                  isIncomeForecast: false,
                  outcome: 12_345,
                  outcomeLock: true,
                  isOutcomeForecast: false,
                },
              ],
            }),
            { status: 200 }
          )
      ) as typeof fetch,
      now: context.now,
    })

    const loaded = await loadWorkspace(context, 'status')
    expect(Object.values(loaded.state.base.budget)).toEqual([
      expect.objectContaining({
        id: '2026-04-01#null',
        date: '2026-04-01',
        tag: null,
        outcome: 12_345,
      }),
    ])
  })

  it('applies remote deletions and rebases the unchanged pending outbox', async () => {
    const context = await makeContext({ ZERRO_TOKEN: 'secret' })
    const base = makeDemoStore({ until: '2022-06-19' })
    const account = Object.values(base.account)[0]
    const tag = Object.values(base.tag)[0]
    const command = issuePatch(
      base,
      { account: [{ id: account.id, title: 'Locally staged title' }] },
      1_000
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

    const response = {
      serverTimestamp: 1_800_000_000,
      deletion: [
        {
          id: tag.id,
          object: 'tag',
          stamp: 1_800_000_000,
          user: Object.values(base.user)[0].id,
        },
      ],
    }
    await refresh(context, {
      fetch: vi.fn(async (_url, init) => {
        const request = JSON.parse(String(init?.body))
        expect(request).not.toHaveProperty('account')
        expect(request).not.toHaveProperty('transaction')
        return new Response(JSON.stringify(response), { status: 200 })
      }) as typeof fetch,
      now: context.now,
    })

    const loaded = await loadWorkspace(context, 'status')
    expect(loaded.state.outbox).toHaveLength(1)
    expect(loaded.state.base.tag[tag.id]).toBeUndefined()
    expect(loaded.current.tag[tag.id]).toBeUndefined()
    expect(loaded.state.base.account[account.id].title).toBe(account.title)
    expect(loaded.current.account[account.id].title).toBe(
      'Locally staged title'
    )
  })

  it('requires a token and leaves an existing state byte-for-byte unchanged', async () => {
    const context = await makeContext({})
    const seeded = await makeContext({ ZERRO_TOKEN: 'seed' }, context.statePath)
    await refresh(seeded, {
      fetch: vi.fn(
        async () =>
          new Response(JSON.stringify({ serverTimestamp: 10 }), { status: 200 })
      ) as typeof fetch,
      now: seeded.now,
    })
    const before = await readFile(context.statePath, 'utf8')

    await expect(refresh(context)).rejects.toMatchObject({
      code: 'TOKEN_REQUIRED',
      exitCode: 4,
    })
    expect(await readFile(context.statePath, 'utf8')).toBe(before)
  })

  it('does not persist malformed or failed responses', async () => {
    const context = await makeContext({ ZERRO_TOKEN: 'secret' })
    await expect(
      refresh(context, {
        fetch: vi.fn(
          async () =>
            new Response(JSON.stringify({ serverTimestamp: 'bad' }), {
              status: 200,
            })
        ) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({ code: 'INVALID_ZENMONEY_RESPONSE' })
    expect((await loadWorkspace(context, 'status')).exists).toBe(false)

    await expect(
      refresh(context, {
        fetch: vi.fn(async () => {
          throw new Error('offline')
        }) as typeof fetch,
        now: context.now,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_FAILURE',
      retryable: true,
    })
    expect((await loadWorkspace(context, 'status')).exists).toBe(false)
  })
})

async function makeContext(
  env: NodeJS.ProcessEnv,
  statePath?: string
): Promise<TToolContext> {
  let path = statePath
  if (!path) {
    const directory = await mkdtemp(join(tmpdir(), 'zerro-tool-refresh-'))
    directories.push(directory)
    path = join(directory, 'state.json')
  }
  return {
    now: () => Date.parse('2026-04-01T00:00:00.000Z'),
    env,
    statePath: path,
    endpoint: 'ru',
    endpointExplicit: false,
  }
}
