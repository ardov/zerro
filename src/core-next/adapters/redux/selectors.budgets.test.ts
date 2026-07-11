import { describe, expect, it, vi } from 'vitest'
import type { TDataStore, TISOMonth } from '6-shared/types'
import type { RootState } from 'store'
import { makeDemoStore } from '../../demo'
import { applyPatch, makeTagBudget } from '../../zenmoney'
import {
  compilePatchUserSettings,
  compileSetBudget,
  envId,
  EnvType,
} from '../../zerro'

// LEGACY-PARITY BRIDGE: remove the budgetModel comparisons when budgetModel.get
// has no production consumers and is deleted. Keep default/preferZmBudgets as
// explicit Core-owned scenarios after that cutover.

// Breaks the legacy hidden-store import cycle, same as the private fixture tests.
vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in this test')
  },
}))

async function importModels() {
  const [{ budgetModel }, { selectCoreBudgets }] = await Promise.all([
    import('5-entities/budget'),
    import('./selectors'),
  ])
  return { budgetModel, selectCoreBudgets }
}

const NOW = Date.parse('2026-05-15T12:00:00Z')
const MONTH = '2026-05' as TISOMonth
const NEXT_MONTH = '2026-06' as TISOMonth

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
  const [tagA, tagB] = Object.keys(demo.tag)
  const userId = Object.values(demo.user)[0].id

  const envBudgetPatch = compileSetBudget(
    demo,
    [
      { id: envId.get(EnvType.Tag, tagA), month: MONTH, value: 10_000 },
      { id: envId.get(EnvType.Tag, tagB), month: NEXT_MONTH, value: 5_000 },
    ],
    ctx
  )
  const withEnvBudgets = applyPatch(demo, envBudgetPatch)

  const tagBudget = makeTagBudget(
    { user: userId, date: `${MONTH}-01`, tag: tagB, outcome: 7_000 },
    ctx
  )

  return {
    store: {
      ...withEnvBudgets,
      budget: { ...withEnvBudgets.budget, [tagBudget.id]: tagBudget },
    },
    tagA,
    tagB,
  }
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

describe('selectCoreBudgets', () => {
  it('matches legacy budgetModel.get with default settings', async () => {
    const { budgetModel, selectCoreBudgets } = await importModels()
    const { store, tagA, tagB } = makeSeededStore()
    const state = makeRootState(store)

    const core = selectCoreBudgets(state)
    const legacy = budgetModel.get(state)

    expect(core).toEqual(legacy)
    expect(core[MONTH][envId.get(EnvType.Tag, tagA)]).toBe(10_000)
    expect(core[NEXT_MONTH][envId.get(EnvType.Tag, tagB)]).toBe(5_000)
    // ZenMoney tag budget is ignored while preferZmBudgets is off
    expect(core[MONTH][envId.get(EnvType.Tag, tagB)]).toBeUndefined()
  })

  it('matches legacy budgetModel.get with preferZmBudgets enabled', async () => {
    const { budgetModel, selectCoreBudgets } = await importModels()
    const { store, tagB } = makeSeededStore()
    const settingsPatch = compilePatchUserSettings(
      store,
      { preferZmBudgets: true },
      ctx
    )
    const state = makeRootState(applyPatch(store, settingsPatch))

    const core = selectCoreBudgets(state)
    const legacy = budgetModel.get(state)

    expect(core).toEqual(legacy)
    // ZenMoney tag budget wins for tag envelopes now
    expect(core[MONTH][envId.get(EnvType.Tag, tagB)]).toBe(7_000)
  })

  it('stays cached across unrelated data changes', async () => {
    const { selectCoreBudgets } = await importModels()
    const { store } = makeSeededStore()
    const first = selectCoreBudgets(makeRootState(store))

    // New current object, new transaction slice, same budget/reminder slices
    const unrelatedChange = makeRootState({
      ...store,
      transaction: { ...store.transaction },
    })

    expect(selectCoreBudgets(unrelatedChange)).toBe(first)
  })

  it('recomputes when hidden env budgets change', async () => {
    const { selectCoreBudgets } = await importModels()
    const { store, tagA } = makeSeededStore()
    const envelopeId = envId.get(EnvType.Tag, tagA)
    const first = selectCoreBudgets(makeRootState(store))
    expect(first[MONTH][envelopeId]).toBe(10_000)

    const budgetPatch = compileSetBudget(
      store,
      [{ id: envelopeId, month: MONTH, value: 12_000 }],
      ctx
    )
    const next = selectCoreBudgets(
      makeRootState(applyPatch(store, budgetPatch))
    )

    expect(next).not.toBe(first)
    expect(next[MONTH][envelopeId]).toBe(12_000)
  })
})
