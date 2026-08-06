import { describe, expect, it } from 'vitest'
import { createEmptyDataStore } from '../../internal/domain/zenmoney'
import {
  journalPersistenceVersion,
  parsePersistedJournal,
  type TPersistedJournal,
} from '../../replica'

const validJournal: TPersistedJournal = {
  version: journalPersistenceVersion,
  activeBranchId: 'main',
  branches: [
    {
      id: 'main',
      checkpoint: createEmptyDataStore(),
      checkpointValidation: { kind: 'unknown' },
      serverTimestamp: 0,
      points: [
        {
          id: 'point-1',
          transition: {
            serverTimestamp: 10,
            upsert: {
              account: [{ id: 'cash', fields: { title: 'Cash' } }],
            },
          },
          validation: { kind: 'unknown' },
          pushed: true,
        },
      ],
    },
  ],
}

describe('parsePersistedJournal', () => {
  it('accepts a versioned active branch and missing storage', () => {
    expect(parsePersistedJournal(undefined)).toBeUndefined()
    expect(parsePersistedJournal(validJournal)).toBe(validJournal)
  })

  it('accepts sealed branches and cached validation results', () => {
    const journal: TPersistedJournal = {
      ...validJournal,
      branches: [
        {
          ...validJournal.branches[0],
          id: 'sealed',
          serverTimestamp: 11,
          points: [
            {
              id: 'point-invalid',
              transition: { serverTimestamp: 11 },
              validation: {
                kind: 'invalid',
                validatorVersion: 3,
                reason: 'Missing debt account',
              },
              pushed: false,
            },
          ],
        },
        validJournal.branches[0],
      ],
    }

    expect(parsePersistedJournal(journal)).toBe(journal)
  })

  it.each([
    [{ ...validJournal, version: 2 }, 'unsupported version'],
    [{ ...validJournal, activeBranchId: 'missing' }, 'active branch'],
    [
      {
        ...validJournal,
        branches: [validJournal.branches[0], validJournal.branches[0]],
      },
      'duplicate branch id',
    ],
    [
      {
        ...validJournal,
        branches: [{ ...validJournal.branches[0], points: [{ id: 'p' }] }],
      },
      'transition',
    ],
    [
      {
        ...validJournal,
        branches: [
          {
            ...validJournal.branches[0],
            points: [
              {
                ...validJournal.branches[0].points[0],
                validation: { kind: 'invalid', validatorVersion: 3 },
              },
            ],
          },
        ],
      },
      'reason',
    ],
    [
      {
        ...validJournal,
        branches: [
          {
            ...validJournal.branches[0],
            checkpointValidation: undefined,
          },
        ],
      },
      'checkpointValidation',
    ],
    [
      {
        ...validJournal,
        branches: [
          {
            ...validJournal.branches[0],
            points: [
              { ...validJournal.branches[0].points[0], pushed: undefined },
            ],
          },
        ],
      },
      'pushed',
    ],
  ])('rejects malformed journal %#', (value, message) => {
    expect(() => parsePersistedJournal(value)).toThrow(message)
  })
})
