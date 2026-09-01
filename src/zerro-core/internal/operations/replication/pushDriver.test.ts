import { describe, expect, it, vi } from 'vitest'

import {
  makeAccount,
  makeStore,
} from '../../../support/testing/zenmoneyTestData'
import { issuePatch, type TCommand } from '../materialization'
import { drivePush, type TPushSendResult } from './pushDriver'
import { beginPush } from './pushRun'

const now = Date.parse('2026-08-31T12:00:00.000Z')

/** Two accounts, so a one-byte bound forces a chunk per account. */
function makeReplica() {
  const base = makeStore({
    serverTimestamp: 100_000,
    account: {
      cash: makeAccount({ id: 'cash', title: 'Cash' }),
      card: makeAccount({ id: 'card', title: 'Card' }),
    },
  })
  const command = issuePatch(
    base,
    {
      account: [
        makeAccount({ id: 'cash', title: 'Wallet' }),
        makeAccount({ id: 'card', title: 'Plastic' }),
      ],
    },
    now
  )
  return { base, outbox: [command] as TCommand[], redo: [] as TCommand[] }
}

function ports(
  replica: ReturnType<typeof makeReplica>,
  send: (request: any) => Promise<TPushSendResult>,
  sleep = vi.fn(async () => undefined)
) {
  let state = replica
  return {
    sleep,
    ports: {
      now: () => now,
      sleep,
      readReplica: () => state,
      send,
      commit: ({ accepted }: any) => {
        state = {
          base: accepted.base,
          outbox: accepted.outbox,
          redo: accepted.redo,
        }
        return { ok: true as const }
      },
    },
    read: () => state,
  }
}

describe('push driver', () => {
  it('delivers every chunk and reports progress between them', async () => {
    const replica = makeReplica()
    const events: string[] = []
    let timestamp = 200_000
    const context = ports(replica, async request => {
      timestamp += 1000
      return { ok: true, patch: { ...request, serverTimestamp: timestamp } }
    })
    const prepared = beginPush(replica, now, { maxBytes: 1 })
    if (!prepared) throw new Error('Expected a prepared push')

    const outcome = await drivePush(prepared, {
      ...context.ports,
      report: event => events.push(event.type),
    })

    expect(outcome).toEqual({ kind: 'done' })
    expect(events).toEqual(['sending', 'done'])
    expect(context.read().outbox).toEqual([])
  })

  it('retries the identical request with backoff, then stops with the remainder', async () => {
    const replica = makeReplica()
    const requests: unknown[] = []
    const context = ports(replica, async request => {
      requests.push(request)
      return { ok: false, message: 'offline' }
    })
    const prepared = beginPush(replica, now, { maxBytes: 1 })
    if (!prepared) throw new Error('Expected a prepared push')

    const outcome = await drivePush(prepared, context.ports)

    expect(context.sleep.mock.calls.flat()).toEqual([1000, 2000, 4000])
    // An unanswered request may already have landed, so a retry has to be the
    // same body rather than a repacked one.
    expect(requests).toEqual([requests[0], requests[0], requests[0], requests[0]])
    expect(outcome).toMatchObject({ kind: 'stopped', message: 'offline' })
    expect(context.read().outbox).toHaveLength(1)
  })

  it('honours a Retry-After delay instead of the backoff curve', async () => {
    const replica = makeReplica()
    let attempt = 0
    let timestamp = 200_000
    const context = ports(replica, async request => {
      attempt += 1
      if (attempt === 1)
        return {
          ok: false,
          message: 'slow down',
          status: 429,
          retryAfterMs: 7000,
        }
      timestamp += 1000
      return { ok: true, patch: { ...request, serverTimestamp: timestamp } }
    })
    const prepared = beginPush(replica, now)
    if (!prepared) throw new Error('Expected a prepared push')

    const outcome = await drivePush(prepared, context.ports)

    expect(context.sleep.mock.calls.flat()).toEqual([7000])
    expect(outcome).toEqual({ kind: 'done' })
  })

  it('does not retry a failure the transport calls final', async () => {
    const replica = makeReplica()
    const context = ports(replica, async () => ({
      ok: false,
      message: 'unreadable response',
      retryable: false,
    }))
    const prepared = beginPush(replica, now)
    if (!prepared) throw new Error('Expected a prepared push')

    const outcome = await drivePush(prepared, context.ports)

    expect(context.sleep).not.toHaveBeenCalled()
    expect(outcome).toMatchObject({ kind: 'stopped' })
  })

  it('abandons a run whose accepted chunk cannot be stored', async () => {
    const replica = makeReplica()
    const prepared = beginPush(replica, now, { maxBytes: 1 })
    if (!prepared) throw new Error('Expected a prepared push')

    const outcome = await drivePush(prepared, {
      now: () => now,
      sleep: async () => undefined,
      readReplica: () => replica,
      send: async request => ({
        ok: true,
        patch: { ...request, serverTimestamp: 200_000 },
      }),
      commit: () => ({ ok: false, message: 'disk is full' }),
    })

    // Not `stopped`: the server already has this chunk, so the run must not
    // come back with an offer to send it again.
    expect(outcome).toEqual({
      kind: 'abandoned',
      progress: expect.any(Array),
      message: 'disk is full',
    })
  })
})
