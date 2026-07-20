import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeBudget,
  makeReminder,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { applyPatch, getTagBudgets } from '../../zenmoney'
import {
  issuePatch,
  materializeCommand,
} from '../../../operations/materialization'
import { EnvType, envId } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { compileSetBudget, compileSetEnvBudget } from './commands'
import { getEnvBudgets } from './read'

describe('env budget commands', () => {
  it('routes tag budgets to hidden env budgets by default', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'budget-reminder']

    const patch = compileSetBudget(
      data,
      { id: foodId, month: '2026-01', value: 100 },
      {
        now: () => 100,
        uuid: () => ids.shift() || 'unused',
      }
    )
    const next = applyPatch(
      data,
      materializeCommand(data, issuePatch(data, patch, 100))
    )

    expect(patch.budget).toBeUndefined()
    expect(getEnvBudgets(next)).toEqual({
      '2026-01': {
        [foodId]: 100,
      },
    })
  })

  it('routes tag envelopes to ZenMoney budgets when preferred', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { preferZmBudgets: true },
        }),
      },
    })

    const patch = compileSetBudget(
      data,
      { id: foodId, month: '2026-01', value: 100 },
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )
    const next = applyPatch(
      data,
      materializeCommand(data, issuePatch(data, patch, 100))
    )

    expect(patch.reminder).toBeUndefined()
    expect(getTagBudgets(next)).toEqual({
      '2026-01-01#food': makeBudget({
        id: '2026-01-01#food',
        changed: 100,
        user: 1,
        date: '2026-01-01',
        tag: 'food',
        outcome: 100,
      }),
    })
  })

  it('splits mixed budget updates between ZenMoney and hidden env budgets', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const cashId = envId.get(EnvType.Account, 'cash')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { preferZmBudgets: true },
        }),
      },
    })

    const patch = compileSetBudget(
      data,
      [
        { id: foodId, month: '2026-01', value: 100 },
        { id: cashId, month: '2026-01', value: 200 },
      ],
      {
        now: () => 100,
        uuid: () => 'budget-reminder',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.budget?.[0]).toMatchObject({
      id: '2026-01-01#food',
      tag: 'food',
      outcome: 100,
    })
    expect(getEnvBudgets(next)).toEqual({
      '2026-01': {
        [cashId]: 200,
      },
    })
  })

  it('sets and clears hidden envelope budgets for an existing month', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const rentId = envId.get(EnvType.Tag, 'rent')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        jan: makeReminder({
          id: 'jan',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.Budgets,
            month: '2026-01',
            payload: {
              [foodId]: 100,
              [rentId]: 500,
            },
          }),
        }),
      },
    })

    const patch = compileSetEnvBudget(
      data,
      [
        { id: foodId, month: '2026-01', value: 200 },
        { id: rentId, month: '2026-01', value: 0 },
      ],
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toBeUndefined()
    expect(getEnvBudgets(next)).toEqual({
      '2026-01': {
        [foodId]: 200,
      },
    })
  })

  it('creates data account once when setting budgets for several months', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const cashId = envId.get(EnvType.Account, 'cash')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'jan-reminder', 'feb-reminder']

    const patch = compileSetEnvBudget(
      data,
      [
        { id: foodId, month: '2026-01', value: 100 },
        { id: cashId, month: '2026-02', value: 200 },
      ],
      {
        now: () => 100,
        uuid: () => ids.shift() || 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toEqual([
      makeAccount({
        id: 'data-account',
        changed: 100,
        title: '🤖 [Zerro Data]',
        user: 1,
        instrument: 2,
      }),
    ])
    expect(patch.reminder?.map(reminder => reminder.id)).toEqual([
      'jan-reminder',
      'feb-reminder',
    ])
    expect(getEnvBudgets(next)).toEqual({
      '2026-01': {
        [foodId]: 100,
      },
      '2026-02': {
        [cashId]: 200,
      },
    })
  })

  it('deletes a month reminder when the resulting month payload is empty', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      reminder: {
        jan: makeReminder('jan', {
          type: HiddenDataType.Budgets,
          month: '2026-01',
          payload: { [foodId]: 100 },
        }),
      },
    })

    const patch = compileSetEnvBudget(
      data,
      { id: foodId, month: '2026-01', value: 0 },
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.deletion?.[0].id).toBe('jan')
    expect(getEnvBudgets(next)).toEqual({})
  })

  it('keeps empty update lists as no-op patches', () => {
    expect(
      compileSetEnvBudget(makeStore(), [], {
        now: () => 100,
        uuid: () => 'unused',
      })
    ).toEqual({})
  })
})
