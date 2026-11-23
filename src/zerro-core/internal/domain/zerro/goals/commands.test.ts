import { materializeTestInput } from '@/zerro-core/support/testing/commandTestData'
import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import type { TISOMonth } from '../../zenmoney/primitives'
import { applyPatch } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { compileSetGoal } from './commands'
import { getRawGoals } from './read'
import { goalType, type TGoal } from './types'

const envelopeId = envId.get(EnvType.Tag, 'food')

function setGoal(
  data: Parameters<typeof compileSetGoal>[0],
  month: TISOMonth,
  goal: TGoal | null
) {
  let n = 0
  const patch = materializeTestInput(
    data,
    compileSetGoal(data, month, envelopeId, goal, {
      now: () => 100,
      uuid: () => `generated-${n++}`,
    })
  )
  return getRawGoals(applyPatch(data, patch).reminder)
}

/** A reminder carrying a month's worth of goal hidden-data. */
const goalReminder = (id: string, month: string, payload: object) =>
  makeReminder({
    id,
    incomeAccount: 'data',
    outcomeAccount: 'data',
    comment: JSON.stringify({
      type: HiddenDataType.Goals,
      month,
      payload,
    }),
  })

describe('goal commands', () => {
  it('stores a monthly goal so it reads back', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })

    expect(
      setGoal(data, '2026-01', { type: goalType.MONTHLY, amount: 100 })
    ).toEqual({
      '2026-01': { [envelopeId]: { type: goalType.MONTHLY, amount: 100 } },
    })
  })

  it('stores a null blocker when deleting a carried goal', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: { data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }) },
    })

    expect(setGoal(data, '2026-02', null)).toEqual({
      '2026-02': { [envelopeId]: null },
    })
  })

  it('removes the nearest future null blocker when setting a new goal', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: { data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }) },
      reminder: {
        feb: goalReminder('feb', '2026-02', { [envelopeId]: null }),
      },
    })

    expect(
      setGoal(data, '2026-01', { type: goalType.MONTHLY_SPEND, amount: 50 })
    ).toEqual({
      '2026-01': { [envelopeId]: { type: goalType.MONTHLY_SPEND, amount: 50 } },
    })
  })

  it('does not remove blockers beyond an explicit future goal', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: { data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }) },
      reminder: {
        feb: goalReminder('feb', '2026-02', {
          [envelopeId]: { type: goalType.MONTHLY, amount: 200 },
        }),
        mar: goalReminder('mar', '2026-03', { [envelopeId]: null }),
      },
    })

    expect(
      setGoal(data, '2026-01', { type: goalType.MONTHLY, amount: 100 })
    ).toEqual({
      '2026-01': { [envelopeId]: { type: goalType.MONTHLY, amount: 100 } },
      '2026-02': { [envelopeId]: { type: goalType.MONTHLY, amount: 200 } },
      '2026-03': { [envelopeId]: null },
    })
  })
})
