import { describe, expect, it } from 'vitest'
import { makeReminder, makeStore } from '../../testing/zenmoneyTestData'
import { HiddenDataType } from '../hidden-data'
import {
  DEFAULT_USER_SETTINGS,
  getStoredUserSettings,
  getUserSettings,
} from './read'

describe('user settings read helpers', () => {
  it('returns stored partial settings', () => {
    const data = makeStore({
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { preferZmBudgets: true },
        }),
      },
    })

    expect(getStoredUserSettings(data)).toEqual({ preferZmBudgets: true })
  })

  it('applies defaults for missing settings', () => {
    expect(getUserSettings(makeStore())).toEqual(DEFAULT_USER_SETTINGS)

    const data = makeStore({
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { emojiIcons: true },
        }),
      },
    })

    expect(getUserSettings(data)).toEqual({
      sawMigrationAlert: false,
      preferZmBudgets: false,
      emojiIcons: true,
    })
  })
})
