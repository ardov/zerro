import { describe, expect, it } from 'vitest'
import { DataEntity } from '6-shared/types'

import {
  makeReminder as makeTestReminder,
  makeStore,
} from '../../../testing/zenmoneyTestData'
import { applyPatch } from '../applyPatch'
import { compileDeleteReminder, compileSetReminder } from './commands'
import { makeReminder } from './factory'
import { getReminders } from './read'

describe('zenmoney reminder commands', () => {
  it('reads the normalized reminder map', () => {
    const reminder = makeTestReminder({ id: 'reminder', comment: 'hello' })
    const data = makeStore({ reminder: { reminder } })

    expect(getReminders(data)).toBe(data.reminder)
  })

  it('creates reminders with root user and deterministic id/time', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
    })

    const patch = compileSetReminder(
      data,
      {
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        comment: 'Rent',
        startDate: '2026-02',
      },
      { now: () => 1700000000000, uuid: () => 'reminder-new' }
    )

    expect(patch.reminder?.[0]).toEqual(
      makeTestReminder({
        id: 'reminder-new',
        changed: 1700000000000,
        user: 1,
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        comment: 'Rent',
        startDate: '2026-02-01',
        endDate: '2023-11-14',
      })
    )
  })

  it('patches existing reminders and preserves current fields', () => {
    const current = makeTestReminder({
      id: 'reminder',
      changed: 1,
      user: 1,
      incomeAccount: 'cash',
      outcomeAccount: 'card',
      comment: 'Old',
      outcome: 50,
    })
    const data = makeStore({ reminder: { reminder: current } })

    const patch = compileSetReminder(
      data,
      { id: 'reminder', comment: 'New' },
      { now: () => 200, uuid: () => 'unused' }
    )
    const next = applyPatch(data, patch)

    expect(patch.reminder?.[0]).toEqual(
      makeTestReminder({
        id: 'reminder',
        changed: 200,
        user: 1,
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        comment: 'New',
        outcome: 50,
      })
    )
    expect(next.reminder.reminder.comment).toBe('New')
    expect(data.reminder.reminder.comment).toBe('Old')
  })

  it('creates production reminder defaults through the reminder factory', () => {
    expect(
      makeReminder(
        {
          user: 1,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        },
        {
          now: () => 1700000000000,
          uuid: () => 'reminder-new',
        }
      )
    ).toEqual(
      makeTestReminder({
        id: 'reminder-new',
        changed: 1700000000000,
        user: 1,
        incomeAccount: 'cash',
        outcomeAccount: 'card',
        startDate: '2023-11-14',
        endDate: '2023-11-14',
      })
    )
  })

  it('deletes existing reminders through normalized deletion patches', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      reminder: {
        reminder: makeTestReminder({ id: 'reminder' }),
      },
    })

    const patch = compileDeleteReminder(data, 'reminder', { now: () => 200 })
    const next = applyPatch(data, patch)

    expect(patch).toEqual({
      deletion: [
        {
          id: 'reminder',
          object: DataEntity.Reminder,
          stamp: 200,
          user: 1,
        },
      ],
    })
    expect(next.reminder.reminder).toBeUndefined()
  })

  it('keeps delete of a missing reminder as a no-op patch', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
    })

    expect(compileDeleteReminder(data, 'missing', { now: () => 200 })).toEqual(
      {}
    )
  })

  it('validates reminder set and delete commands', () => {
    expect(() =>
      compileSetReminder(
        makeStore(),
        { incomeAccount: 'cash', outcomeAccount: 'card' },
        { now: () => 1, uuid: () => 'reminder' }
      )
    ).toThrow('User is not defined')

    expect(() =>
      compileSetReminder(
        makeStore({
          user: {
            1: { id: 1, parent: null },
          } as any,
        }),
        { incomeAccount: 'cash' } as any,
        { now: () => 1, uuid: () => 'reminder' }
      )
    ).toThrow('Missing incomeAccount or outcomeAccount')

    expect(() =>
      compileDeleteReminder(makeStore(), 'reminder', { now: () => 1 })
    ).toThrow('User is not defined')
  })
})
