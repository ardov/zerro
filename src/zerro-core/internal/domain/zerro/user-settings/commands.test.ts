import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import { HiddenDataType } from '../hidden-data'
import { compilePatchUserSettings } from './commands'
import { getStoredUserSettings, getUserSettings } from './read'

describe('user settings commands', () => {
  it('patches stored settings and removes undefined keys', () => {
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
            payload: {
              preferZmBudgets: true,
              emojiIcons: true,
            },
          }),
        }),
      },
    })

    const patch = compilePatchUserSettings(
      data,
      {
        preferZmBudgets: undefined,
        sawMigrationAlert: true,
        emojiIcons: false,
      },
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toBeUndefined()
    expect(patch.reminder?.[0].comment).toBe(
      JSON.stringify({
        type: HiddenDataType.UserSettings,
        payload: {
          emojiIcons: false,
          sawMigrationAlert: true,
        },
      })
    )
    expect(getStoredUserSettings(next)).toEqual({
      emojiIcons: false,
      sawMigrationAlert: true,
    })
    expect(getUserSettings(next)).toEqual({
      sawMigrationAlert: true,
      preferZmBudgets: false,
      emojiIcons: false,
    })
  })

  it('creates the data account when patching settings for the first time', () => {
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'settings-reminder']

    const patch = compilePatchUserSettings(
      data,
      { preferZmBudgets: true },
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
    expect(getStoredUserSettings(next)).toEqual({ preferZmBudgets: true })
  })
})
