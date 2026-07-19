import { describe, expect, it } from 'vitest'
import { parsePersistedReplica } from './persistence'

const validReplica = {
  version: 2,
  baseServerTimestamp: 100,
  outbox: [
    {
      type: 'patch',
      patch: { account: [{ id: 'cash', title: 'Wallet' }] },
      issuedAt: 10,
    },
  ],
  outboxHead: 1,
}

describe('parsePersistedReplica', () => {
  it('accepts command-only replay records and missing storage', () => {
    expect(parsePersistedReplica(undefined)).toBeUndefined()
    expect(parsePersistedReplica(validReplica)).toBe(validReplica)
  })

  it('accepts a sparse transaction patch', () => {
    const replica = {
      ...validReplica,
      outbox: [
        {
          type: 'patch',
          patch: {
            transaction: [
              { id: 'tr-1', viewed: true, tag: ['food'] },
              { id: 'tr-2', viewed: true, tag: ['food'] },
            ],
          },
          issuedAt: 10,
        },
      ],
    }

    expect(parsePersistedReplica(replica)).toBe(replica)
  })

  it('accepts multiple transaction intents in one command', () => {
    const replica = {
      ...validReplica,
      outbox: [
        {
          type: 'patch',
          patch: {
            transaction: [
              { id: 'source', income: 0.00001, outcome: 0.00001 },
              { id: 'replacement', income: 0, outcome: 25 },
            ],
          },
          issuedAt: 10,
        },
      ],
    }

    expect(parsePersistedReplica(replica)).toBe(replica)
  })

  it('accepts deletion identity without materialized protocol metadata', () => {
    const replica = {
      ...validReplica,
      outbox: [
        {
          type: 'patch',
          patch: {
            deletion: [{ id: 'rent', object: 'reminder' }],
          },
          issuedAt: 10,
        },
      ],
    }

    expect(parsePersistedReplica(replica)).toBe(replica)
  })

  it.each([
    [{ ...validReplica, version: 1 }, 'unsupported version'],
    [{ ...validReplica, outboxHead: 2 }, 'outbox head is out of range'],
    [
      {
        ...validReplica,
        outbox: [
          {
            type: 'unknown',
            patch: { transaction: [{ id: 'tr-1', viewed: true }] },
            issuedAt: 10,
          },
        ],
      },
      'outbox[0].type is invalid',
    ],
    [
      {
        ...validReplica,
        outbox: [
          {
            type: 'patch',
            patch: { unknown: [{ id: 'tr-1' }] },
            issuedAt: 10,
          },
        ],
      },
      'outbox[0].patch.unknown is invalid',
    ],
    [
      {
        ...validReplica,
        outbox: [
          {
            type: 'patch',
            patch: { deletion: [{ id: 'rent', object: 'unknown' }] },
            issuedAt: 10,
          },
        ],
      },
      'outbox[0].patch.deletion is invalid',
    ],
    [
      {
        ...validReplica,
        outbox: [{ ...validReplica.outbox[0], issuedAt: 'yesterday' }],
      },
      'metadata is invalid',
    ],
  ])('rejects corrupt replay input %#', (value, message) => {
    expect(() => parsePersistedReplica(value)).toThrow(message as string)
  })
})
