import { describe, expect, it } from 'vitest'
import type { TDataStore, TReminder } from '6-shared/types'
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
        settings: reminder('settings', {
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
        settings: reminder('settings', {
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

function reminder(id: string, comment: unknown): TReminder {
  return {
    id,
    comment: JSON.stringify(comment),
  } as TReminder
}

function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}
