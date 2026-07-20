import { describe, expect, it } from 'vitest'

import {
  makeBudget as makeTestBudget,
  makeStore,
} from '../../testing/zenmoneyTestData'
import { applyPatch } from './applyPatch'
import { compileSetTagBudget } from './budgets'
import { makeTagBudget } from './budgets'
import { toBudgetId } from './budgets'
import { getTagBudgets } from './budgets'

describe('zenmoney budget commands', () => {
  it('reads the normalized tag budget map', () => {
    const budget = makeTestBudget({
      id: '2026-01-01#food',
      tag: 'food',
      outcome: 100,
    })
    const data = makeStore({ budget: { [budget.id]: budget } })

    expect(getTagBudgets(data)).toBe(data.budget)
  })

  it('compiles sparse tag-budget creation intent', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
    })

    const patch = compileSetTagBudget(data, {
      tag: 'food',
      month: '2026-01',
      value: 100,
    })

    expect(patch.budget?.[0]).toEqual({
      id: '2026-01-01#food',
      date: '2026-01-01',
      tag: 'food',
      outcome: 100,
    })
  })

  it('preserves existing budget fields when updating a tag budget', () => {
    const current = makeTestBudget({
      id: '2026-01-01#food',
      changed: 1,
      user: 2,
      date: '2026-01-01',
      tag: 'food',
      income: 40,
      outcome: 80,
    })
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      budget: {
        [current.id]: current,
      },
    })

    const patch = compileSetTagBudget(data, {
      tag: 'food',
      month: '2026-01',
      value: 100,
    })
    const next = applyPatch(data, patch)

    expect(patch.budget?.[0]).toEqual({
      id: '2026-01-01#food',
      date: '2026-01-01',
      tag: 'food',
      outcome: 100,
    })
    expect(next.budget[current.id].outcome).toBe(100)
    expect(data.budget[current.id].outcome).toBe(80)
  })

  it('creates production tag budget defaults through the budget factory', () => {
    expect(
      makeTagBudget(
        {
          user: 1,
          date: '2026-01',
          tag: null,
        },
        { now: () => 100 }
      )
    ).toEqual(
      makeTestBudget({
        id: '2026-01-01#null',
        changed: 100,
        user: 1,
        date: '2026-01-01',
        tag: null,
      })
    )
  })

  it('preserves explicit writable false values in the budget factory', () => {
    expect(
      makeTagBudget(
        {
          user: 1,
          date: '2026-01',
          tag: 'food',
          incomeLock: false,
          outcomeLock: false,
        },
        { now: () => 100 }
      )
    ).toMatchObject({ incomeLock: false, outcomeLock: false })
  })

  it('builds budget ids from normalized date and tag', () => {
    expect(toBudgetId('2026-02', 'food')).toBe('2026-02-01#food')
    expect(toBudgetId('2026-02-10', null)).toBe('2026-02-10#null')
  })

  it('defers root-user validation for tag budget creation to materialization', () => {
    expect(() =>
      compileSetTagBudget(makeStore(), {
        tag: 'food',
        month: '2026-01',
        value: 100,
      })
    ).not.toThrow()
  })
})
