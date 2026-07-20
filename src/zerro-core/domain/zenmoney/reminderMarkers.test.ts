import { describe, expect, it } from 'vitest'

import {
  makeReminderMarker as makeTestReminderMarker,
  makeStore,
} from '../../testing/zenmoneyTestData'
import { makeReminderMarker } from './reminderMarkers'
import { getReminderMarkers } from './reminderMarkers'

describe('zenmoney reminder marker reads and factory', () => {
  it('reads the normalized reminder marker map', () => {
    const marker = makeTestReminderMarker({ id: 'marker' })
    const data = makeStore({ reminderMarker: { marker } })

    expect(getReminderMarkers(data)).toBe(data.reminderMarker)
  })

  it('creates production reminder marker defaults through the marker factory', () => {
    expect(
      makeReminderMarker(
        {
          user: 1,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
          date: '2026-02',
          reminder: 'reminder',
        },
        {
          now: () => 1700000000000,
          uuid: () => 'marker-new',
        }
      )
    ).toEqual(
      makeTestReminderMarker({
        id: 'marker-new',
        changed: 1700000000000,
        user: 1,
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        date: '2026-02-01',
        reminder: 'reminder',
      })
    )
  })
})
