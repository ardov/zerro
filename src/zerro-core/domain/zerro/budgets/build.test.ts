import { describe, expect, it } from 'vitest'
import { makeBudget } from '../../../testing/zenmoneyTestData'
import { EnvType, envId } from '../envelope-id'
import { buildBudgets } from './build'

describe('buildBudgets', () => {
  it('uses hidden envelope budgets when ZenMoney budgets are not preferred', () => {
    const tagId = envId.get(EnvType.Tag, 'food')
    const accountId = envId.get(EnvType.Account, 'safe')

    expect(
      buildBudgets({
        preferZmBudgets: false,
        tagBudgets: {
          '2026-01-01#food': makeBudget({
            id: '2026-01-01#food',
            tag: 'food',
            outcome: 100,
          }),
        },
        envBudgets: {
          '2026-01': {
            [tagId]: 200,
            [accountId]: 300,
          },
        },
      })
    ).toEqual({
      '2026-01': {
        [tagId]: 200,
        [accountId]: 300,
      },
    })
  })

  it('uses ZenMoney tag budgets and skips hidden tag budgets when preferred', () => {
    const tagId = envId.get(EnvType.Tag, 'food')
    const accountId = envId.get(EnvType.Account, 'safe')

    expect(
      buildBudgets({
        preferZmBudgets: true,
        tagBudgets: {
          '2026-01-01#food': makeBudget({
            id: '2026-01-01#food',
            tag: 'food',
            outcome: 100,
          }),
          '2026-01-01#zero': makeBudget({
            id: '2026-01-01#zero',
            tag: 'zero',
            outcome: 0,
          }),
        },
        envBudgets: {
          '2026-01': {
            [tagId]: 200,
            [accountId]: 300,
          },
        },
      })
    ).toEqual({
      '2026-01': {
        [tagId]: 100,
        [accountId]: 300,
      },
    })
  })

  it('maps ZenMoney null tag budgets to the uncategorized envelope', () => {
    const nullTagId = envId.get(EnvType.Tag, null)

    expect(
      buildBudgets({
        preferZmBudgets: true,
        tagBudgets: {
          '2026-01-01#null': makeBudget({
            id: '2026-01-01#null',
            tag: null,
            outcome: 50,
          }),
        },
        envBudgets: {},
      })
    ).toEqual({
      '2026-01': {
        [nullTagId]: 50,
      },
    })
  })

  it('drops falsy hidden budgets', () => {
    const tagId = envId.get(EnvType.Tag, 'food')

    expect(
      buildBudgets({
        preferZmBudgets: false,
        tagBudgets: {},
        envBudgets: {
          '2026-01': {
            [tagId]: 0,
          },
        },
      })
    ).toEqual({})
  })
})
