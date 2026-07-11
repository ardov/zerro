import { describe, expect, it } from 'vitest'
import { DataEntity } from '6-shared/types'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import {
  compileResetSimpleHiddenData,
  compileSetMonthlyHiddenData,
  compileSetSimpleHiddenData,
  HiddenDataType,
  stringifyHiddenDataComment,
} from '.'

describe('hidden data write codecs', () => {
  it('stringifies hidden data comments', () => {
    expect(
      stringifyHiddenDataComment({
        type: HiddenDataType.UserSettings,
        payload: { emojiIcons: true },
      })
    ).toBe(
      JSON.stringify({
        type: HiddenDataType.UserSettings,
        payload: { emojiIcons: true },
      })
    )
  })

  it('sets simple hidden data and creates the data account when missing', () => {
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'settings-reminder']

    const patch = compileSetSimpleHiddenData(
      data,
      HiddenDataType.UserSettings,
      { emojiIcons: true },
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
    expect(patch.reminder).toEqual([
      makeReminder({
        id: 'settings-reminder',
        changed: 100,
        user: 1,
        incomeAccount: 'data-account',
        outcomeAccount: 'data-account',
        income: 1,
        startDate: '2020-01-01',
        endDate: '2020-01-01',
        comment: JSON.stringify({
          type: HiddenDataType.UserSettings,
          payload: { emojiIcons: true },
        }),
      }),
    ])
    expect(Object.keys(next.account)).toEqual(['data-account'])
    expect(Object.keys(next.reminder)).toEqual(['settings-reminder'])
  })

  it('updates existing simple hidden data reminder through the existing data account', () => {
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        settings: makeReminder({
          id: 'settings',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.UserSettings,
            payload: { emojiIcons: false },
          }),
        }),
      },
    })

    const patch = compileSetSimpleHiddenData(
      data,
      HiddenDataType.UserSettings,
      { emojiIcons: true },
      {
        now: () => 200,
        uuid: () => 'unused',
      }
    )

    expect(patch.account).toBeUndefined()
    expect(patch.reminder).toEqual([
      makeReminder({
        id: 'settings',
        changed: 200,
        user: 1,
        incomeAccount: 'data',
        outcomeAccount: 'data',
        income: 1,
        startDate: '2020-01-01',
        endDate: '2020-01-01',
        comment: JSON.stringify({
          type: HiddenDataType.UserSettings,
          payload: { emojiIcons: true },
        }),
      }),
    ])
  })

  it('sets monthly hidden data and deletes empty monthly payloads', () => {
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
            payload: { envelope: 50 },
          }),
        }),
      },
    })

    const setPatch = compileSetMonthlyHiddenData(
      data,
      HiddenDataType.Budgets,
      { envelope: 100 },
      '2026-01',
      {
        now: () => 200,
        uuid: () => 'unused',
      }
    )
    const resetPatch = compileSetMonthlyHiddenData(
      data,
      HiddenDataType.Budgets,
      {},
      '2026-01',
      {
        now: () => 300,
        uuid: () => 'unused',
      }
    )

    expect(setPatch.reminder?.[0].comment).toBe(
      JSON.stringify({
        type: HiddenDataType.Budgets,
        month: '2026-01',
        payload: { envelope: 100 },
      })
    )
    expect(resetPatch).toEqual({
      deletion: [
        {
          id: 'jan',
          object: DataEntity.Reminder,
          stamp: 300,
          user: 1,
        },
      ],
    })
  })

  it('keeps reset of missing simple hidden data as a no-op patch', () => {
    expect(
      compileResetSimpleHiddenData(makeStore(), HiddenDataType.UserSettings, {
        now: () => 100,
      })
    ).toEqual({})
  })

  it('validates monthly hidden data month', () => {
    expect(() =>
      compileSetMonthlyHiddenData(
        makeStore(),
        HiddenDataType.Budgets,
        { envelope: 100 },
        'not-month' as never,
        {
          now: () => 100,
          uuid: () => 'unused',
        }
      )
    ).toThrow('Invalid month')
  })
})
