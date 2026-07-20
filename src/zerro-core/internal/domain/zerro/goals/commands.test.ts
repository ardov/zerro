import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { compileSetGoal } from './commands'
import { getRawGoals } from './read'
import { goalType } from './types'

describe('goal commands', () => {
  it('sets a monthly goal and creates hidden data storage', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'goal-reminder']

    const patch = compileSetGoal(
      data,
      '2026-01',
      envelopeId,
      { type: goalType.MONTHLY, amount: 100 },
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
    expect(getRawGoals(next)).toEqual({
      '2026-01': {
        [envelopeId]: { type: goalType.MONTHLY, amount: 100 },
      },
    })
  })

  it('stores null blockers when deleting a carried goal', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })

    const patch = compileSetGoal(data, '2026-02', envelopeId, null, {
      now: () => 100,
      uuid: () => 'goal-reminder',
    })
    const next = applyPatch(data, patch)

    expect(patch.account).toBeUndefined()
    expect(getRawGoals(next)).toEqual({
      '2026-02': {
        [envelopeId]: null,
      },
    })
  })

  it('removes the nearest future null blocker when setting a new goal', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        feb: makeReminder({
          id: 'feb',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.Goals,
            month: '2026-02',
            payload: {
              [envelopeId]: null,
            },
          }),
        }),
      },
    })

    const patch = compileSetGoal(
      data,
      '2026-01',
      envelopeId,
      { type: goalType.MONTHLY_SPEND, amount: 50 },
      {
        now: () => 100,
        uuid: () => 'jan',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.reminder?.map(reminder => reminder.id)).toEqual(['jan'])
    expect(patch.deletion?.map(deletion => deletion.id)).toEqual(['feb'])
    expect(getRawGoals(next)).toEqual({
      '2026-01': {
        [envelopeId]: { type: goalType.MONTHLY_SPEND, amount: 50 },
      },
    })
  })

  it('does not remove future blockers beyond an explicit future goal', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        feb: makeReminder({
          id: 'feb',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.Goals,
            month: '2026-02',
            payload: {
              [envelopeId]: { type: goalType.MONTHLY, amount: 200 },
            },
          }),
        }),
        mar: makeReminder({
          id: 'mar',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.Goals,
            month: '2026-03',
            payload: {
              [envelopeId]: null,
            },
          }),
        }),
      },
    })

    const patch = compileSetGoal(
      data,
      '2026-01',
      envelopeId,
      { type: goalType.MONTHLY, amount: 100 },
      {
        now: () => 100,
        uuid: () => 'jan',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.deletion).toBeUndefined()
    expect(getRawGoals(next)['2026-03']).toEqual({
      [envelopeId]: null,
    })
  })
})
