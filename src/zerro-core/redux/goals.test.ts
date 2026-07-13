import { describe, expect, it, vi } from 'vitest'
import type { TDataStore, TISOMonth } from '6-shared/types'
import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import { makeDemoStore } from '../demo'
import { applyPatch } from '../domain/zenmoney'
import { compileSetGoal, envId, EnvType, goalType } from '../domain/zerro'

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

async function importModels() {
  await i18n.changeLanguage('en')
  return import('../testing/reduxSelectors')
}

function makeSeededStore() {
  const demo = makeDemoStore({ now: NOW })
  const tagId = Object.keys(demo.tag)[0]
  const envelopeId = envId.get(EnvType.Tag, tagId)

  const goalPatch = compileSetGoal(
    demo,
    MONTH,
    envelopeId,
    { type: goalType.MONTHLY, amount: 30_000 },
    ctx
  )
  return { store: applyPatch(demo, goalPatch), envelopeId }
}

function makeRootState(data: TDataStore): RootState {
  return {
    data: {
      current: data,
      base: data,
      outbox: [],
      outboxHead: 0,
    },
    displayCurrency: null,
    isPending: false,
    lastSync: {
      finishedAt: 0,
      isSuccessful: null,
      errorMessage: null,
    },
    token: null,
  }
}

describe('selectGoals chain', () => {
  it('builds goals and totals from seeded goal data', async () => {
    const { selectGoals, selectGoalTotals } = await importModels()
    const { store, envelopeId } = makeSeededStore()
    const state = makeRootState(store)

    const core = selectGoals(state)
    expect(core[MONTH][envelopeId]?.goal.amount).toBe(30_000)
    expect(selectGoalTotals(state)[MONTH].goalsCount).toBeGreaterThan(0)
  })

  it('stays cached across unrelated data changes', async () => {
    const { selectGoals, selectGoalTotals } = await importModels()
    const { store } = makeSeededStore()
    const goals = selectGoals(makeRootState(store))
    const totals = selectGoalTotals(makeRootState(store))

    // Goals pull nearly the whole projection graph, so this also guards the
    // upstream nodes against accidental whole-current dependencies.
    const unrelatedChange = makeRootState({
      ...store,
      country: { ...store.country },
      company: { ...store.company },
    })

    expect(selectGoals(unrelatedChange)).toBe(goals)
    expect(selectGoalTotals(unrelatedChange)).toBe(totals)
  })

  it('recomputes when a goal changes', async () => {
    const { selectGoals } = await importModels()
    const { store, envelopeId } = makeSeededStore()
    const first = selectGoals(makeRootState(store))

    const goalPatch = compileSetGoal(
      store,
      MONTH,
      envelopeId,
      { type: goalType.MONTHLY, amount: 45_000 },
      ctx
    )
    const next = selectGoals(makeRootState(applyPatch(store, goalPatch)))

    expect(next).not.toBe(first)
    expect(next[MONTH][envelopeId]?.goal.amount).toBe(45_000)
  })
})
