import { materializeTestInput } from '@/zerro-core/support/testing/commandTestData'
import { beforeAll, describe, expect, it } from 'vitest'
import type { TISOMonth } from '@/6-shared/types'
import { i18n } from '@/6-shared/localization'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import { applyPatch } from '../../internal/domain/zenmoney'
import {
  compileSetGoal,
  envId,
  EnvType,
  goalType,
} from '../../internal/domain/zerro'
import {
  selectGoals,
  selectGoalTotals,
} from '../../support/testing/reduxSelectors'

const NOW = Date.parse('2026-05-15T12:00:00Z')
const MONTH = '2026-05' as TISOMonth

const ctx = {
  now: () => NOW,
  uuid: (() => {
    let counter = 0
    return () =>
      `00000000-0000-4000-8000-${String(counter++).padStart(12, '0')}`
  })(),
}

function makeSeededStore() {
  const demo = makeDemoStore({ now: NOW })
  const tagId = Object.keys(demo.tag)[0]
  const envelopeId = envId.get(EnvType.Tag, tagId)

  const goalPatch = materializeTestInput(
    demo,
    compileSetGoal(
      demo,
      MONTH,
      envelopeId,
      { type: goalType.MONTHLY, amount: 30_000 },
      ctx
    ),
    NOW
  )
  return { store: applyPatch(demo, goalPatch), envelopeId }
}

const makeRootState = makeTestRootState

describe('selectGoals chain', () => {
  beforeAll(() => i18n.changeLanguage('en'))

  it('updates the projected goal when its stored amount changes', () => {
    const { store, envelopeId } = makeSeededStore()
    expect(
      selectGoals(makeRootState(store))[MONTH][envelopeId].goal.amount
    ).toBe(30_000)

    const goalPatch = materializeTestInput(
      store,
      compileSetGoal(
        store,
        MONTH,
        envelopeId,
        { type: goalType.MONTHLY, amount: 45_000 },
        ctx
      ),
      NOW
    )
    const updated = makeRootState(applyPatch(store, goalPatch))
    expect(selectGoals(updated)[MONTH][envelopeId]?.goal.amount).toBe(45_000)
    expect(selectGoalTotals(updated)[MONTH].goalsCount).toBe(1)
  })
})
