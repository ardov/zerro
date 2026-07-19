import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../testing/zenmoneyTestData'
import {
  isCommandRebaseSafe,
  issuePatch,
  materializeCommand,
  type TCommand,
} from './materializeCommand'

describe('materializeCommand', () => {
  it('applies a sparse transaction patch over the latest full entity', () => {
    const current = makeTransaction({
      id: 'tr-1',
      changed: 200,
      income: 11,
      viewed: true,
    })
    const command = issuePatch(
      { transaction: [{ id: 'tr-1', viewed: false }] },
      100
    )

    expect(
      materializeCommand(
        makeStore({ transaction: { 'tr-1': current } }),
        command
      )
    ).toEqual({
      transaction: [{ ...current, viewed: false, changed: 1200 }],
    })
  })

  it('patches a batch and skips no-op, deleted, or missing targets', () => {
    const first = makeTransaction({ id: 'first', viewed: false })
    const second = makeTransaction({ id: 'second', viewed: true })
    const deleted = makeTransaction({ id: 'deleted', deleted: true })
    const command = issuePatch(
      {
        transaction: ['first', 'second', 'deleted', 'missing'].map(id => ({
          id,
          viewed: true,
        })),
      },
      100
    )

    expect(
      materializeCommand(
        makeStore({ transaction: { first, second, deleted } }),
        command
      ).transaction?.map(transaction => transaction.id)
    ).toEqual(['first'])
  })

  it('materializes a missing sparse target as an empty patch', () => {
    const command = issuePatch(
      { transaction: [{ id: 'missing', viewed: true }] },
      100
    )

    expect(materializeCommand(makeStore(), command)).toEqual({})
  })

  it('filters system fields from stale runtime transaction patches', () => {
    const current = makeTransaction({
      id: 'tr-1',
      created: 100,
      comment: 'Before',
    })
    const command = {
      type: 'patch',
      issuedAt: 300,
      patch: {
        transaction: [{ id: 'tr-1', created: 500, comment: 'After' }],
      },
    } as unknown as TCommand

    expect(
      materializeCommand(
        makeStore({ transaction: { 'tr-1': current } }),
        command
      ).transaction?.[0]
    ).toMatchObject({ created: 100, comment: 'After' })
  })

  it('recreates a transaction as two intents in the same command', () => {
    const source = makeTransaction({
      id: 'source',
      changed: 200,
      created: 100,
      income: 0,
      outcome: 25,
      comment: 'Before',
    })
    const replacement = {
      ...source,
      id: 'replacement',
      created: 500,
      comment: 'After',
    }
    const command = issuePatch(
      {
        transaction: [
          { id: source.id, income: 0.00001, outcome: 0.00001 },
          replacement,
        ],
      },
      300
    )

    const initial = materializeCommand(
      makeStore({ transaction: { source } }),
      command
    )
    expect(initial.transaction).toEqual([
      { ...source, income: 0.00001, outcome: 0.00001, changed: 1200 },
      { ...replacement, changed: 300 },
    ])

    const hiddenSource = initial.transaction![0]
    const retry = materializeCommand(
      makeStore({ transaction: { source: hiddenSource } }),
      command,
      400
    )
    expect(retry.transaction).toEqual([{ ...replacement, changed: 400 }])
  })

  it('replays a complete transitional patch with a fresh version', () => {
    const account = makeAccount({ id: 'cash', changed: 500, title: 'Cash' })
    const command = issuePatch(
      { account: [{ ...account, title: 'Wallet' }] },
      100
    )

    expect(
      materializeCommand(makeStore({ account: { cash: account } }), command)
        .account?.[0]
    ).toMatchObject({ title: 'Wallet', changed: 1500 })
  })

  it('only marks sparse transaction patches as safe for automatic rebase', () => {
    expect(
      isCommandRebaseSafe(
        issuePatch({ transaction: [{ id: 'tr-1', viewed: true }] }, 100)
      )
    ).toBe(true)
    expect(
      isCommandRebaseSafe(
        issuePatch(
          { account: [makeAccount({ id: 'cash', title: 'Wallet' })] },
          100
        )
      )
    ).toBe(false)
  })
})
