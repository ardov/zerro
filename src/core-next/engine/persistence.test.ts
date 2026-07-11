import { describe, expect, it } from 'vitest'
import { parsePersistedReplica } from './persistence'

const validReplica = {
  version: 1,
  baseServerTimestamp: 100,
  outbox: [
    {
      id: 'entry-1',
      command: { type: 'test.command' },
      intentPatch: {},
      appliedPatch: { account: [{ id: 'cash', title: 'Wallet' }] },
      materializerVersion: 1,
      createdAt: 10,
    },
  ],
  outboxHead: 1,
}

describe('parsePersistedReplica', () => {
  it('accepts a valid replay record and missing storage', () => {
    expect(parsePersistedReplica(undefined)).toBeUndefined()
    expect(parsePersistedReplica(validReplica)).toBe(validReplica)
  })

  it.each([
    [{ ...validReplica, version: 2 }, 'unsupported version'],
    [{ ...validReplica, outboxHead: 2 }, 'outbox head is out of range'],
    [
      {
        ...validReplica,
        outbox: [{ ...validReplica.outbox[0], appliedPatch: { nope: [] } }],
      },
      'appliedPatch.nope is invalid',
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
