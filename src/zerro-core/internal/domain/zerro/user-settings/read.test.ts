import { describe, expect, it } from 'vitest'
import {
  makeReminder,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { HiddenDataType } from '../hidden-data'
import { getUserSettings } from './read'

describe('user settings read helpers', () => {
  it('applies defaults for missing settings', () => {
    expect(getUserSettings(makeStore().reminder)).toEqual({
      sawMigrationAlert: false,
      preferZmBudgets: false,
    })

    const data = makeStore({
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { preferZmBudgets: true },
        }),
      },
    })

    expect(getUserSettings(data.reminder)).toEqual({
      sawMigrationAlert: false,
      preferZmBudgets: true,
    })
  })
})
