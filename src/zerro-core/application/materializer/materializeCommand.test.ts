import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../testing/zenmoneyTestData'
import {
  isCommandSatisfied,
  makeResolvedPatchCommand,
  materializeCommand,
  type TTransactionRecreateCommand,
  type TTransactionsPatchCommand,
} from './materializeCommand'

describe('materializeCommand', () => {
  it('applies a sparse transaction patch over the latest full entity', () => {
    const current = makeTransaction({
      id: 'tr-1',
      changed: 200,
      income: 11,
      viewed: true,
    })
    const command: TTransactionsPatchCommand = {
      type: 'transactions.patch',
      payload: { ids: ['tr-1'], set: { viewed: false } },
    }

    expect(
      materializeCommand(
        makeStore({ transaction: { 'tr-1': current } }),
        command,
        100
      )
    ).toEqual({
      transaction: [{ ...current, viewed: false, changed: 1200 }],
    })
  })

  it('patches a batch as one command and skips no-op or deleted targets', () => {
    const first = makeTransaction({ id: 'first', viewed: false })
    const second = makeTransaction({ id: 'second', viewed: true })
    const deleted = makeTransaction({ id: 'deleted', deleted: true })
    const command: TTransactionsPatchCommand = {
      type: 'transactions.patch',
      payload: {
        ids: ['first', 'second', 'deleted', 'missing'],
        set: { viewed: true },
      },
    }

    expect(
      materializeCommand(
        makeStore({ transaction: { first, second, deleted } }),
        command,
        100
      ).transaction?.map(transaction => transaction.id)
    ).toEqual(['first'])
  })

  it('filters system fields from stale runtime transaction patches', () => {
    const current = makeTransaction({
      id: 'tr-1',
      created: 100,
      comment: 'Before',
    })
    const command = {
      type: 'transactions.patch',
      payload: {
        ids: ['tr-1'],
        set: { created: 500, comment: 'After' },
      },
    } as unknown as TTransactionsPatchCommand

    expect(
      materializeCommand(
        makeStore({ transaction: { 'tr-1': current } }),
        command,
        300
      ).transaction?.[0]
    ).toMatchObject({ created: 100, comment: 'After' })

    expect(
      isCommandSatisfied(
        makeStore({
          transaction: {
            'tr-1': { ...current, comment: 'After' },
          },
        }),
        command
      )
    ).toBe(true)
  })

  it('recreates a transaction under a new id and can finish a partial retry', () => {
    const source = makeTransaction({
      id: 'source',
      changed: 200,
      created: 100,
      income: 0,
      outcome: 25,
      comment: 'Before',
    })
    const command: TTransactionRecreateCommand = {
      type: 'transaction.recreate',
      payload: {
        sourceId: 'source',
        replacementId: 'replacement',
        set: {
          created: 500,
          income: 0,
          outcome: 25,
          comment: 'After',
        },
      },
    }

    const initial = materializeCommand(
      makeStore({ transaction: { source } }),
      command,
      300
    )
    expect(initial.transaction).toEqual([
      { ...source, income: 0.00001, outcome: 0.00001, changed: 1200 },
      {
        ...source,
        id: 'replacement',
        created: 500,
        comment: 'After',
        changed: 300,
      },
    ])

    const hiddenSource = initial.transaction![0]
    const retry = materializeCommand(
      makeStore({ transaction: { source: hiddenSource } }),
      command,
      400
    )
    expect(retry.transaction).toEqual([
      {
        ...hiddenSource,
        id: 'replacement',
        created: 500,
        income: 0,
        outcome: 25,
        comment: 'After',
        changed: 400,
      },
    ])
  })

  it('replays transitional resolved patches with a fresh entity version', () => {
    const account = makeAccount({ id: 'cash', changed: 500, title: 'Cash' })
    const command = makeResolvedPatchCommand({
      account: [{ ...account, title: 'Wallet' }],
    })

    expect(
      materializeCommand(
        makeStore({ account: { cash: account } }),
        command,
        100
      ).account?.[0]
    ).toMatchObject({ title: 'Wallet', changed: 1500 })
  })

  it('acknowledges sparse commands only after canonical fields match', () => {
    const command: TTransactionsPatchCommand = {
      type: 'transactions.patch',
      payload: { ids: ['tr-1'], set: { viewed: true, tag: ['food'] } },
    }

    expect(
      isCommandSatisfied(
        makeStore({
          transaction: {
            'tr-1': makeTransaction({
              id: 'tr-1',
              viewed: false,
              tag: ['food'],
            }),
          },
        }),
        command
      )
    ).toBe(false)
    expect(
      isCommandSatisfied(
        makeStore({
          transaction: {
            'tr-1': makeTransaction({
              id: 'tr-1',
              viewed: true,
              tag: ['food'],
            }),
          },
        }),
        command
      )
    ).toBe(true)
  })

  it('treats an empty comment and canonical null as the same intent', () => {
    const command: TTransactionsPatchCommand = {
      type: 'transactions.patch',
      payload: { ids: ['tr-1'], set: { comment: '' } },
    }

    expect(
      isCommandSatisfied(
        makeStore({
          transaction: {
            'tr-1': makeTransaction({ id: 'tr-1', comment: null }),
          },
        }),
        command
      )
    ).toBe(true)
  })

  it('acknowledges recreate only after the old row is hidden and replacement exists', () => {
    const source = makeTransaction({ id: 'source', outcome: 25 })
    const replacement = makeTransaction({
      id: 'replacement',
      created: 500,
      outcome: 25,
    })
    const command: TTransactionRecreateCommand = {
      type: 'transaction.recreate',
      payload: {
        sourceId: source.id,
        replacementId: replacement.id,
        set: { created: 500, income: 0, outcome: 25 },
      },
    }

    expect(
      isCommandSatisfied(
        makeStore({ transaction: { source, replacement } }),
        command
      )
    ).toBe(false)
    expect(
      isCommandSatisfied(
        makeStore({
          transaction: {
            source: { ...source, income: 0.00001, outcome: 0.00001 },
            replacement,
          },
        }),
        command
      )
    ).toBe(true)
  })
})
