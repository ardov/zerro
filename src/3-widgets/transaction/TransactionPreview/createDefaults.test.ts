import { describe, expect, it } from 'vitest'
import { core } from '@/zerro-core/redux'
import { createDefaultsFromQuery } from './createDefaults'

describe('createDefaultsFromQuery', () => {
  it('takes only unambiguous creation values from the list context', () => {
    expect(
      createDefaultsFromQuery({
        clauses: [
          { kind: 'account', ids: ['card', 'cash'] },
          { kind: 'tag', ids: ['food', 'null'] },
          {
            kind: 'type',
            values: [core.transactions.TrFilterType.Income],
          },
          { kind: 'amount', gte: 125, lte: 125 },
          { kind: 'date', from: '2026-09-01', to: '2026-09-01' },
        ],
      })
    ).toEqual({
      account: 'card',
      tag: ['food'],
      type: 'income',
      amount: 125,
      date: '2026-09-01',
    })
  })

  it('does not guess a debt direction, range amount, or range date', () => {
    expect(
      createDefaultsFromQuery({
        clauses: [
          { kind: 'type', values: ['debt'] },
          { kind: 'amount', gte: 100, lte: 200 },
          { kind: 'date', from: '2026-09-01', to: '2026-09-30' },
        ],
      })
    ).toEqual({
      account: undefined,
      tag: undefined,
      type: undefined,
      amount: undefined,
      date: undefined,
    })
  })

  it('takes category, direction, and month from an envelope activity filter', () => {
    expect(
      createDefaultsFromQuery(
        {
          clauses: [
            {
              kind: 'activity',
              envelopeIds: [
                core.envelopes.envId.get(core.envelopes.EnvType.Tag, 'food'),
              ],
              scope: 'self',
              mode: core.transactions.TrFilterMode.Envelope,
              month: '2026-02',
            },
          ],
        },
        +new Date(2026, 0, 31)
      )
    ).toMatchObject({
      tag: ['food'],
      type: 'outcome',
      date: '2026-02-28',
    })
  })
})
