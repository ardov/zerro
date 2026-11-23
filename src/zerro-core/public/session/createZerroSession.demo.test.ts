import { describe, expect, it } from 'vitest'
import { createZerroSession } from '../../headless'
import { makeDemoStore } from '../../support/demo'

describe('headless session on deterministic demo data', () => {
  it('finds the March rent and includes it in the envelope outcome', () => {
    const now = '2026-04-15T12:00:00.000Z'
    const store = makeDemoStore({
      locale: 'en',
      now,
      until: '2026-03-31',
      scale: 0.35,
    })
    const session = createZerroSession(store, {
      now: () => Date.parse(now),
      uuid: () => 'demo-id',
    })

    const matches = session.transactions.query({
      clauses: [
        { kind: 'search', value: 'monthly rent' },
        { kind: 'date', from: '2026-03-01', to: '2026-03-31' },
      ],
    })
    expect(matches).toMatchObject([
      { date: '2026-03-22', outcome: 350, tag: ['Rent'] },
    ])
    const march = session.activity.getSorted()['2026-03']
    expect(march.outcomes.find(node => node.id === 'tag#Rent')).toMatchObject({
      total: { total: { EUR: -350 }, transactionCount: 1 },
    })
  })
})
