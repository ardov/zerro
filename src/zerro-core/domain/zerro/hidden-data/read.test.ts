import { describe, expect, it } from 'vitest'
import { makeReminder, makeStore } from '../../../testing/zenmoneyTestData'
import {
  getMonthlyHiddenData,
  getMonthlyHiddenDataReminders,
  getSimpleHiddenData,
  getSimpleHiddenDataReminder,
  HiddenDataType,
  parseHiddenDataComment,
} from '.'

describe('hidden data read codecs', () => {
  it('parses hidden data comments', () => {
    expect(
      parseHiddenDataComment(
        JSON.stringify({ type: HiddenDataType.UserSettings, payload: {} })
      )
    ).toEqual({ type: HiddenDataType.UserSettings, payload: {} })

    expect(parseHiddenDataComment(null)).toBeNull()
    expect(parseHiddenDataComment('not-json')).toBeNull()
    expect(parseHiddenDataComment(JSON.stringify({ payload: {} }))).toBeNull()
  })

  it('reads simple hidden data', () => {
    const data = makeStore({
      reminder: {
        settings: makeReminder('settings', {
          type: HiddenDataType.UserSettings,
          payload: { emojiIcons: true },
        }),
      },
    })

    expect(getSimpleHiddenData(data, HiddenDataType.UserSettings, {})).toEqual({
      emojiIcons: true,
    })
    expect(
      getSimpleHiddenDataReminder(data, HiddenDataType.UserSettings)?.id
    ).toBe('settings')
    expect(getSimpleHiddenData(data, HiddenDataType.EnvelopeMeta, {})).toEqual(
      {}
    )
  })

  it('reads monthly hidden data and ignores invalid months', () => {
    const data = makeStore({
      reminder: {
        jan: makeReminder('jan', {
          type: HiddenDataType.Budgets,
          month: '2026-01',
          payload: { envelope: 100 },
        }),
        invalidMonth: makeReminder('invalidMonth', {
          type: HiddenDataType.Budgets,
          month: 'not-month',
          payload: { envelope: 200 },
        }),
        otherType: makeReminder('otherType', {
          type: HiddenDataType.Goals,
          month: '2026-01',
          payload: { envelope: {} },
        }),
      },
    })

    expect(getMonthlyHiddenData(data, HiddenDataType.Budgets)).toEqual({
      '2026-01': { envelope: 100 },
    })
    expect(
      Object.keys(getMonthlyHiddenDataReminders(data, HiddenDataType.Budgets))
    ).toEqual(['2026-01'])
  })
})
