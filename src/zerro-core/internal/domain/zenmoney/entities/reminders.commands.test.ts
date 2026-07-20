import { describe, expect, it } from 'vitest'

import {
  makeReminder as makeTestReminder,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../model/applyPatch'
import { compileDeleteReminder, compileSetReminder } from './reminders'
import { makeReminder } from './reminders'

describe('zenmoney reminder commands', () => {
  it('creates reminders with root user and deterministic id/time', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
    })

    const patch = compileSetReminder(
      { reminders: data.reminder, users: data.user },
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

  it('compiles sparse patches for existing reminders', () => {
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
      { reminders: data.reminder, users: data.user },
      { id: 'reminder', comment: 'New' },
      { now: () => 200, uuid: () => 'unused' }
    )
    const next = applyPatch(data, patch)

    expect(patch.reminder?.[0]).toEqual({ id: 'reminder', comment: 'New' })
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

  it('compiles sparse deletion intent for existing reminders', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      reminder: {
        reminder: makeTestReminder({ id: 'reminder' }),
      },
    })

    const patch = compileDeleteReminder(data.reminder, 'reminder')
    const next = applyPatch(data, patch)

    expect(patch).toEqual({
      deletion: [
        {
          id: 'reminder',
          object: 'reminder',
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

    expect(compileDeleteReminder(data.reminder, 'missing')).toEqual({})
  })

  it('validates reminder set and delete commands', () => {
    const empty = makeStore()
    const withUser = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
    })

    expect(() =>
      compileSetReminder(
        { reminders: empty.reminder, users: empty.user },
        { incomeAccount: 'cash', outcomeAccount: 'card' },
        { now: () => 1, uuid: () => 'reminder' }
      )
    ).toThrow('User is not defined')

    expect(() =>
      compileSetReminder(
        { reminders: withUser.reminder, users: withUser.user },
        { incomeAccount: 'cash' } as any,
        { now: () => 1, uuid: () => 'reminder' }
      )
    ).toThrow('Missing incomeAccount or outcomeAccount')

    expect(() =>
      compileDeleteReminder(empty.reminder, 'reminder')
    ).not.toThrow()
  })
})
