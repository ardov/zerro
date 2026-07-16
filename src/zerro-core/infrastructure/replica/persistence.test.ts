import { describe, expect, it } from 'vitest'
import { parsePersistedReplica } from './persistence'

const validReplica = {
  version: 1,
  baseServerTimestamp: 100,
  outbox: [
    {
      type: 'patch',
      payload: { account: [{ id: 'cash', title: 'Wallet' }] },
      createdAt: 10,
    },
  ],
  outboxHead: 1,
}

describe('parsePersistedReplica', () => {
  it('accepts command-only replay records and missing storage', () => {
    expect(parsePersistedReplica(undefined)).toBeUndefined()
    expect(parsePersistedReplica(validReplica)).toBe(validReplica)
  })

  it('accepts a whitelisted sparse transaction patch', () => {
    const replica = {
      ...validReplica,
      outbox: [
        {
          type: 'transactions.patch',
          payload: {
            ids: ['tr-1', 'tr-2'],
            set: { viewed: true, tag: ['food'] },
          },
          createdAt: 10,
        },
      ],
    }

    expect(parsePersistedReplica(replica)).toBe(replica)
  })

  it('accepts a transaction recreate command with explicit replacement id', () => {
    const replica = {
      ...validReplica,
      outbox: [
        {
          type: 'transaction.recreate',
          payload: {
            sourceId: 'source',
            replacementId: 'replacement',
            set: { created: 50, income: 0, outcome: 25 },
          },
          createdAt: 10,
        },
      ],
    }

    expect(parsePersistedReplica(replica)).toBe(replica)
  })

  it.each([
    [{ ...validReplica, version: 2 }, 'unsupported version'],
    [{ ...validReplica, outboxHead: 2 }, 'outbox head is out of range'],
    [
      {
        ...validReplica,
        outbox: [
          {
            type: 'transactions.patch',
            payload: { ids: ['tr-1'], set: { changed: 10 } },
            createdAt: 10,
          },
        ],
      },
      'outbox[0] is invalid',
    ],
    [
      {
        ...validReplica,
        outbox: [
          {
            type: 'transactions.patch',
            payload: { ids: ['tr-1'], set: { created: 10 } },
            createdAt: 10,
          },
        ],
      },
      'outbox[0] is invalid',
    ],
    [
      {
        ...validReplica,
        outbox: [{ ...validReplica.outbox[0], createdAt: 'yesterday' }],
      },
      'metadata is invalid',
    ],
  ])('rejects corrupt replay input %#', (value, message) => {
    expect(() => parsePersistedReplica(value)).toThrow(message as string)
  })
})
