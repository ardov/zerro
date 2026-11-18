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

  it('takes category and direction from the envelope and the month from the visible period', () => {
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
            },
            { kind: 'date', from: '2026-02-01', to: '2026-02-28' },
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

  it.each([
    { bounds: { from: '2026-12-20', to: '2027-01-05' }, date: '2027-01-05' },
    { bounds: { from: '2027-02-10' }, date: '2027-02-10' },
    { bounds: { to: '2026-12-31' }, date: '2026-12-31' },
  ] as const)(
    'keeps the draft inside the edited range $bounds',
    ({ bounds, date }) => {
      const draft = createDefaultsFromQuery(
        {
          clauses: [
            {
              kind: 'activity',
              envelopeIds: ['tag#food'],
              scope: 'self',
              mode: core.transactions.TrFilterMode.Envelope,
            },
            { kind: 'date', ...bounds },
          ],
        },
        +new Date(2027, 0, 15)
      )
      expect(draft.date).toBe(date)
    }
  )
})

it('does not prefill a currency-qualified amount into an unspecified account currency', () => {
  expect(
    createDefaultsFromQuery({
      clauses: [{ kind: 'amount', currencies: ['USD'], gte: 100, lte: 100 }],
    }).amount
  ).toBeUndefined()
})
