import { describe, expect, it } from 'vitest'
import { makeTransaction } from '@/zerro-core/support/testing/zenmoneyTestData'
import type { TFxCode, TISODate } from '@/6-shared/types'
import {
  getBreakdown,
  getDimensions,
  getSteps,
  isSpreadOverTime,
  getTimeline,
  summarize,
  type TSummaryContext,
} from './model'

const codes: Record<number, TFxCode> = { 1: 'USD', 2: 'EUR' }
const ctx: TSummaryContext = {
  debtAccountId: 'debt',
  currencyOf: instrument => codes[instrument],
  // A euro is worth two dollars, whatever the date.
  rate: (from, to) => (from === to ? 1 : from === 'EUR' ? 2 : 0.5),
}

const spend = (patch: Parameters<typeof makeTransaction>[0]) =>
  makeTransaction({ outcome: 10, ...patch })

describe('summarize', () => {
  it('totals each flow and leaves transfers out of the net', () => {
    const summary = summarize(
      [
        makeTransaction({ id: 'salary', income: 100, date: '2026-03-05' }),
        spend({ id: 'food', outcome: 30, date: '2026-03-01' }),
        makeTransaction({ id: 'lent', outcome: 20, incomeAccount: 'debt' }),
        makeTransaction({ id: 'moved', income: 50, outcome: 50 }),
      ],
      'EUR',
      ctx
    )
    expect(summary.flows.map(({ flow, value }) => [flow, value])).toEqual([
      ['income', 100],
      ['outcome', -30],
      ['debt', -20],
      ['transfer', 50],
    ])
    expect(summary.net).toBe(50)
    // One currency is shown as it is, whatever currency was asked for.
    expect(summary).toMatchObject({ currency: 'USD', converted: false })
    expect(summary.range).toEqual({ from: '2026-01-10', to: '2026-03-05' })
    expect(summary.sides).toEqual(['outcome', 'income'])
  })

  it('keeps exact sums per currency beside the converted total', () => {
    const summary = summarize(
      [
        spend({ id: 'usd', outcome: 10 }),
        spend({ id: 'usd2', outcome: 5 }),
        spend({ id: 'eur', outcome: 3, outcomeInstrument: 2 }),
      ],
      'USD',
      ctx
    )
    expect(summary).toMatchObject({ currency: 'USD', converted: true })
    expect(summary.currencies).toEqual(['USD', 'EUR'])
    expect(summary.flows).toEqual([
      {
        flow: 'outcome',
        value: -21,
        native: [
          { currency: 'USD', amount: -15 },
          { currency: 'EUR', amount: -3 },
        ],
      },
    ])
    // A single flow has nothing to net against.
    expect(summary.net).toBeNull()
  })
})

describe('breakdown and timeline', () => {
  const { entries } = summarize(
    [
      spend({ id: 'a', tag: ['food'], merchant: 'lidl', date: '2026-01-10' }),
      spend({ id: 'b', tag: ['food'], payee: 'Corner  Shop!', outcome: 40 }),
      spend({ id: 'c', tag: null, payee: 'corner shop', date: '2026-03-20' }),
    ],
    'USD',
    ctx
  )

  it('groups by main category and by place, largest first', () => {
    expect(getDimensions(entries)).toEqual(['category', 'place'])
    expect(
      getBreakdown(entries, 'category').map(group => [group.key, group.value])
    ).toEqual([
      ['food', 50],
      ['null', 10],
    ])
    expect(
      getBreakdown(entries, 'place').map(group => [group.key, group.count])
    ).toEqual([
      ['p:corner shop', 2],
      ['m:lidl', 1],
    ])
  })

  it('fills empty periods and opens with the finest readable step', () => {
    expect(getTimeline(entries, 'month')).toEqual([
      // The outer months are cut to the days the entries cover.
      {
        from: '2026-01-10',
        to: '2026-01-31',
        value: 50,
        count: 2,
        ongoing: false,
      },
      {
        from: '2026-02-01',
        to: '2026-02-28',
        value: 0,
        count: 0,
        ongoing: false,
      },
      {
        from: '2026-03-01',
        to: '2026-03-20',
        value: 10,
        count: 1,
        ongoing: false,
      },
    ])
    // Seventy days are too many bars; eleven weeks are not.
    expect(getSteps(entries)).toEqual({
      available: ['week', 'month'],
      initial: 'week',
    })
    expect(getTimeline(entries, 'week')[1]).toMatchObject({
      from: '2026-01-12',
      to: '2026-01-18',
    })
  })

  it('draws a lone income on the periods and dimensions of both sides', () => {
    const income = summarize(
      [makeTransaction({ id: 'salary', income: 100, date: '2026-02-03' })],
      'USD',
      ctx
    ).entries
    expect(getDimensions(income)).toEqual([])
    expect(getDimensions(entries, income)).toEqual(['category', 'place'])
    expect(
      getTimeline(income, 'month', [...entries, ...income]).map(
        bucket => bucket.value
      )
    ).toEqual([0, 100, 0])
  })

  it('judges a timeline on its finest step, and always has one to draw', () => {
    const days = (...dates: TISODate[]) =>
      summarize(
        dates.map((date, index) => spend({ id: `day-${index}`, date })),
        'USD',
        ctx
      ).entries
    // Three days in two weeks: worth a chart, whichever step is chosen.
    const spread = days('2026-03-02', '2026-03-03', '2026-03-09')
    expect(getSteps(spread).available).toEqual(['day', 'week'])
    expect(isSpreadOverTime(spread)).toBe(true)
    expect(isSpreadOverTime(days('2026-03-02', '2026-03-09'))).toBe(false)
    // One day cannot be split, yet it is still a period to draw.
    expect(getSteps(days('2026-03-02', '2026-03-02'))).toEqual({
      available: ['day'],
      initial: 'day',
    })
  })

  it('marks the period that is still running', () => {
    const marks = getTimeline(entries, 'month', entries, '2026-03-05').map(
      bucket => bucket.ongoing
    )
    expect(marks).toEqual([false, false, true])
    expect(getTimeline(entries, 'month').every(bucket => !bucket.ongoing)).toBe(
      true
    )
  })
})
