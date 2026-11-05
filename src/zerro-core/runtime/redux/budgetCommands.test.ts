import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { undoClientCommand, redoClientCommand } from '@/store/data'
import { core } from '@/zerro-core/redux'
import { toast } from '@/6-shared/ui/kit/Toast'
import { applyPatch } from '../../internal/domain/zenmoney'
import {
  compileSetBudget,
  compileSetGoal,
  compilePatchEnvelopeMeta,
  compilePatchUserSettings,
  goalType,
  type TBudgetUpdate,
  type TEnvelopeId,
  type TGoal,
} from '../../internal/domain/zerro'
import {
  parseCommandOutbox,
  replayOutbox,
} from '../../internal/operations/replication/outbox'
import { materializeTestInput } from '../../support/testing/commandTestData'
import {
  makeStore,
  makeUser,
  makeAccount,
  makeInstrument,
  makeTag,
  makeTransaction,
} from '../../support/testing/zenmoneyTestData'
import type { TCompiled, TDataStore } from '../../types'
import type { TISODate } from '../../internal/domain/foundation/primitives'
import {
  globalBudgetTagId,
  makeTagBudget,
} from '../../internal/domain/zenmoney/entities/budgets'
import { graph } from './graph'

const NOW = Date.parse('2026-07-29T12:00:00Z')
const MONTH = '2026-07'
const PARENT: TEnvelopeId = 'tag#parent'
const CHILD: TEnvelopeId = 'tag#child'
const OTHER: TEnvelopeId = 'tag#other'
let counter = 0
const ctx = { now: () => NOW, uuid: () => `budget-fixture-${++counter}` }
beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(NOW))
afterEach(() => vi.restoreAllMocks())

function apply(data: TDataStore, compiled: TCompiled<unknown>) {
  return applyPatch(data, materializeTestInput(data, compiled, NOW))
}
function fixture({
  assignments = [],
  goals = [],
  transactions = {},
  native = false,
}: {
  assignments?: TBudgetUpdate[]
  goals?: [TEnvelopeId, TGoal][]
  transactions?: TDataStore['transaction']
  native?: boolean
} = {}) {
  let data = makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    instrument: {
      1: makeInstrument({ id: 1, shortTitle: 'USD', rate: 1 }),
      2: makeInstrument({ id: 2, shortTitle: 'EUR', rate: 2 }),
    },
    account: { cash: makeAccount({ id: 'cash', inBalance: true }) },
    tag: {
      parent: makeTag({ id: 'parent', title: 'Parent', showOutcome: true }),
      child: makeTag({
        id: 'child',
        title: 'Child',
        parent: 'parent',
        showOutcome: true,
      }),
      other: makeTag({ id: 'other', title: 'Other', showOutcome: true }),
    },
    transaction: transactions,
  })
  if (native)
    data = apply(
      data,
      compilePatchUserSettings(data, { preferZmBudgets: true }, ctx)
    )
  data = apply(data, compileSetBudget(data, assignments, ctx))
  for (const [id, goal] of goals)
    data = apply(data, compileSetGoal(data, MONTH, id, goal, ctx))
  return data
}
function storeFor(data: TDataStore) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(data),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
  })
}
function expense(
  id: string,
  tag: string,
  amount: number,
  date: TISODate = '2026-07-10'
) {
  return makeTransaction({
    id,
    date,
    tag: [tag],
    outcome: amount,
    incomeAccount: 'cash',
    outcomeAccount: 'cash',
  })
}
function expectSingleUndo(
  store: ReturnType<typeof storeFor>,
  before: TDataStore
) {
  const after = store.getState().data.current
  expect(store.getState().data.outbox).toHaveLength(1)
  store.dispatch(undoClientCommand())
  expect(store.getState().data.current).toEqual(before)
  store.dispatch(redoClientCommand())
  expect(store.getState().data.current).toEqual(after)
  const restored = parseCommandOutbox(
    JSON.parse(JSON.stringify(store.getState().data.outbox))
  )
  expect(replayOutbox(before, restored)).toEqual(after)
}

describe('semantic budget commands', () => {
  it('preserves the native global budget when clearing future envelope assignments', () => {
    const data = fixture({
      native: true,
      assignments: [{ id: CHILD, month: '2026-08', value: 30 }],
    })
    const global = makeTagBudget(
      {
        tag: globalBudgetTagId,
        date: '2026-08',
        user: 1,
        outcome: 1000,
        income: 2000,
      },
      ctx
    )
    const before = { ...data, budget: { ...data.budget, [global.id]: global } }
    const store = storeFor(before)
    store.dispatch(core.budgets.restart(MONTH))
    expect(store.getState().data.current.budget[global.id]).toEqual(global)
    expect(
      core.budgets.selectAll(store.getState())['2026-08']?.[CHILD] ?? 0
    ).toBe(0)
    expectSingleUndo(store, before)
  })

  it.each([false, true])(
    'preserves assignments of absent envelopes when restarting (native: %s)',
    native => {
      const data = fixture({
        native,
        assignments: [
          { id: CHILD, month: '2026-08', value: 30 },
          { id: OTHER, month: '2026-08', value: 40 },
        ],
      })
      const before = {
        ...data,
        tag: { parent: data.tag.parent, child: data.tag.child },
      }
      const store = storeFor(before)
      expect(core.envelopes.selectAll(store.getState())[OTHER]).toBeUndefined()
      store.dispatch(core.budgets.restart(MONTH))
      const budgets = core.budgets.selectAll(store.getState())['2026-08']
      expect(budgets?.[CHILD] ?? 0).toBe(0)
      expect(budgets[OTHER]).toBe(40)
      expectSingleUndo(store, before)
    }
  )

  it('sets the exact goal amount for one envelope while bulk funding never reduces it', () => {
    const before = fixture({
      assignments: [{ id: PARENT, month: MONTH, value: 200 }],
      goals: [[PARENT, { type: goalType.MONTHLY, amount: 100 }]],
    })
    const store = storeFor(before)
    expect(store.dispatch(core.budgets.fundGoals(MONTH)).status).toBe('noop')
    expect(
      core.budgets
        .selectPresets(store.getState(), MONTH, PARENT)
        .find(p => p.kind === 'goalAmount')?.amount
    ).toBe(100)
    store.dispatch(
      core.budgets.applyPreset({ id: PARENT, month: MONTH, kind: 'goalAmount' })
    )
    expect(
      core.activity.selectEnvelopeMetrics(store.getState())[MONTH][PARENT]
        .totalAssigned.USD
    ).toBe(100)
    expectSingleUndo(store, before)
  })

  it('keeps presets stable across unrelated slices and updates them after budget and goal edits', () => {
    const before = fixture({
      assignments: [
        { id: PARENT, month: MONTH, value: 90 },
        { id: CHILD, month: MONTH, value: 10 },
      ],
    })
    const store = storeFor(before)
    const initial = core.budgets.selectPresets(store.getState(), MONTH, PARENT)
    const unrelated = makeTestRootState({
      ...before,
      reminderMarker: { ...before.reminderMarker },
    })
    expect(core.budgets.selectPresets(unrelated, MONTH, PARENT)).toBe(initial)
    store.dispatch(
      core.budgets.setTotalAssigned({ id: CHILD, month: MONTH, amount: 20 })
    )
    const changed = core.budgets.selectPresets(store.getState(), MONTH, PARENT)
    expect(changed).not.toBe(initial)
    expect(changed.find(p => p.kind === 'childrenAssigned')?.amount).toBe(20)
    store.dispatch(
      core.goals.set(MONTH, PARENT, { type: goalType.MONTHLY, amount: 150 })
    )
    const withGoal = core.budgets.selectPresets(store.getState(), MONTH, PARENT)
    expect(withGoal).not.toBe(changed)
    expect(withGoal.find(p => p.kind === 'goalAmount')?.amount).toBe(150)
  })

  it('uses warm app projections for a single edit without rebuilding draft activity', () => {
    const before = fixture({
      assignments: [{ id: CHILD, month: MONTH, value: 10 }],
    })
    const store = storeFor(before)
    const metrics = graph.envMetrics(before)
    const readMetrics = vi.spyOn(graph, 'envMetrics')
    const readActivity = vi.spyOn(graph, 'activity')
    store.dispatch(
      core.budgets.setTotalAssigned({ id: PARENT, month: MONTH, amount: 100 })
    )
    expect(readMetrics).toHaveReturnedWith(metrics)
    expect(readActivity).not.toHaveBeenCalled()
    expect(core.budgets.selectAll(store.getState())[MONTH][PARENT]).toBe(90)
    expect(metrics[MONTH][PARENT].totalAssigned.USD).toBe(10)
  })

  it('does not read projections for an empty move', () => {
    const store = storeFor(fixture())
    const readBudgets = vi.spyOn(graph, 'budgets')
    expect(
      store.dispatch(
        core.budgets.moveFunds({
          month: MONTH,
          from: PARENT,
          to: PARENT,
          money: { amount: 10, currency: 'USD' },
        })
      ).status
    ).toBe('noop')
    expect(
      store.dispatch(
        core.budgets.moveFunds({
          month: MONTH,
          from: PARENT,
          to: CHILD,
          money: { amount: 0, currency: 'USD' },
        })
      ).status
    ).toBe('noop')
    expect(readBudgets).not.toHaveBeenCalled()
  })

  it('rejects invalid months in compiled operations and persisted commands', () => {
    const before = fixture()
    expect(() =>
      compileSetBudget(before, { id: PARENT, month: '2026-13', value: 10 }, ctx)
    ).toThrow()
    const store = storeFor(before)
    store.dispatch(
      core.budgets.setTotalAssigned({ id: PARENT, month: MONTH, amount: 10 })
    )
    const persisted = JSON.parse(JSON.stringify(store.getState().data.outbox))
    persisted[0].operations[0].month = '2026-13'
    expect(() => parseCommandOutbox(persisted)).toThrow()
  })

  it.each([false, true])(
    'funds children before parents in one command (native budgets: %s)',
    native => {
      const before = fixture({
        native,
        assignments: [
          { id: PARENT, month: MONTH, value: 90 },
          { id: CHILD, month: MONTH, value: 10 },
        ],
        goals: [
          [PARENT, { type: goalType.MONTHLY, amount: 150 }],
          [CHILD, { type: goalType.MONTHLY, amount: 20 }],
        ],
      })
      const store = storeFor(before)
      expect(store.dispatch(core.budgets.fundGoals(MONTH)).status).toBe(
        'applied'
      )
      const metrics = core.activity.selectEnvelopeMetrics(store.getState())[
        MONTH
      ]
      expect(metrics[PARENT].selfAssigned.USD).toBe(130)
      expect(metrics[PARENT].totalAssigned.USD).toBe(150)
      expect(metrics[CHILD].selfAssigned.USD).toBe(20)
      expect(
        core.months.selectTotals(store.getState())[MONTH].toBeAssignedState
      ).toBe('negative')
      expect(store.getState().data.outbox[0].label?.verb).toBe(
        'budget-goals-funded'
      )
      expect(store.dispatch(core.budgets.fundGoals(MONTH)).status).toBe('noop')
      expectSingleUndo(store, before)
    }
  )

  it('does not reduce assignments when children exceed the parent goal; skips endless balance goals', () => {
    const before = fixture({
      assignments: [{ id: PARENT, month: MONTH, value: 30 }],
      goals: [
        [PARENT, { type: goalType.MONTHLY, amount: 100 }],
        [CHILD, { type: goalType.MONTHLY, amount: 150 }],
        [OTHER, { type: goalType.TARGET_BALANCE, amount: 500 }],
      ],
    })
    const store = storeFor(before)
    store.dispatch(core.budgets.fundGoals(MONTH))
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[PARENT].selfAssigned.USD).toBe(30)
    expect(metrics[PARENT].totalAssigned.USD).toBe(180)
    expect(metrics[OTHER].selfAssigned.USD).toBe(0)
    expectSingleUndo(store, before)
  })

  it('funds parent and child goals in different currencies using final child assignments', () => {
    let before = fixture({
      goals: [
        [PARENT, { type: goalType.MONTHLY, amount: 150 }],
        [CHILD, { type: goalType.MONTHLY, amount: 20 }],
      ],
    })
    before = apply(
      before,
      compilePatchEnvelopeMeta(before, { id: CHILD, currency: 'EUR' }, ctx)
    )
    const store = storeFor(before)
    store.dispatch(core.budgets.fundGoals(MONTH))
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[CHILD].selfAssigned.EUR).toBe(20)
    expect(metrics[PARENT].selfAssigned.USD).toBe(110)
    expect(
      core.currency.selectConvertFx(store.getState())(
        metrics[PARENT].totalAssigned,
        'USD',
        MONTH
      )
    ).toBe(150)
    expectSingleUndo(store, before)
  })

  it('covers assigned children and then parents without giving pooled children their own budget', () => {
    let before = fixture({
      assignments: [{ id: CHILD, month: MONTH, value: 10 }],
      transactions: {
        child: expense('child', 'child', 30),
        parent: expense('parent', 'parent', 20),
        other: expense('other', 'other', 15),
      },
    })
    before = {
      ...before,
      tag: { ...before.tag, other: { ...before.tag.other, parent: 'parent' } },
    }
    const store = storeFor(before)
    store.dispatch(core.budgets.coverOverspending(MONTH))
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[CHILD].selfAssigned.USD).toBe(30)
    expect(metrics[CHILD].selfAvailable.USD).toBe(0)
    expect(metrics[OTHER].selfAssigned.USD).toBe(0)
    expect(metrics[OTHER].selfAvailable.USD).toBe(-15)
    expect(metrics[PARENT].selfAssigned.USD).toBe(35)
    expect(metrics[PARENT].selfAvailable.USD).toBe(0)
    expect(store.dispatch(core.budgets.coverOverspending(MONTH)).status).toBe(
      'noop'
    )
    expectSingleUndo(store, before)
  })

  it.each([false, true])(
    'resets previous/current leftovers and clears future own assignments (native: %s)',
    native => {
      const before = fixture({
        native,
        assignments: [
          { id: PARENT, month: '2026-06', value: 5 },
          { id: CHILD, month: '2026-06', value: 10 },
          { id: PARENT, month: MONTH, value: 20 },
          { id: CHILD, month: MONTH, value: 15 },
          { id: PARENT, month: '2026-08', value: 25 },
          { id: CHILD, month: '2026-08', value: 30 },
        ],
        transactions: {
          earlier: expense('earlier', 'parent', 1, '2026-06-01'),
        },
        goals: [[PARENT, { type: goalType.MONTHLY, amount: 100 }]],
      })
      const store = storeFor(before)
      store.dispatch(core.budgets.restart(MONTH))
      const metrics = core.activity.selectEnvelopeMetrics(store.getState())
      for (const month of ['2026-06', MONTH, '2026-08'] as const) {
        expect(metrics[month][PARENT].selfAvailable.USD).toBe(0)
        expect(metrics[month][CHILD].selfAvailable.USD).toBe(0)
      }
      expect(metrics['2026-08'][PARENT].selfAssigned.USD).toBe(0)
      expect(metrics['2026-08'][CHILD].selfAssigned.USD).toBe(0)
      expect(store.getState().data.current.transaction).toEqual(
        before.transaction
      )
      expect(
        core.goals.selectAll(store.getState())[MONTH][PARENT].goal.amount
      ).toBe(100)
      expect(store.dispatch(core.budgets.restart(MONTH)).status).toBe('noop')
      expectSingleUndo(store, before)
    }
  )

  it('can restart in the first month without a previous projected month', () => {
    const before = fixture({
      assignments: [{ id: PARENT, month: MONTH, value: 100 }],
    })
    const store = storeFor(before)
    store.dispatch(core.budgets.restart(MONTH))
    expect(
      core.activity.selectEnvelopeMetrics(store.getState())[MONTH][PARENT]
        .selfAvailable.USD
    ).toBe(0)
    expectSingleUndo(store, before)
  })

  it('copies own assignments including zero without double-counting children', () => {
    const before = fixture({
      assignments: [
        { id: PARENT, month: '2026-06', value: 50 },
        { id: CHILD, month: '2026-06', value: 20 },
        { id: OTHER, month: MONTH, value: 100 },
        { id: CHILD, month: MONTH, value: 90 },
      ],
    })
    const store = storeFor(before)
    store.dispatch(core.budgets.copyAssignments({ from: '2026-06', to: MONTH }))
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[PARENT].selfAssigned.USD).toBe(50)
    expect(metrics[PARENT].totalAssigned.USD).toBe(70)
    expect(metrics[CHILD].selfAssigned.USD).toBe(20)
    expect(metrics[OTHER].selfAssigned.USD).toBe(0)
    expectSingleUndo(store, before)
  })

  it('sets total assignment while retaining a child assignment in another currency', () => {
    let before = fixture({
      assignments: [{ id: CHILD, month: MONTH, value: 10 }],
    })
    before = apply(
      before,
      compilePatchEnvelopeMeta(before, { id: CHILD, currency: 'EUR' }, ctx)
    )
    const store = storeFor(before)
    store.dispatch(
      core.budgets.setTotalAssigned({ id: PARENT, month: MONTH, amount: 100 })
    )
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[PARENT].selfAssigned.USD).toBe(80)
    expect(metrics[CHILD].selfAssigned.EUR).toBe(10)
    expectSingleUndo(store, before)
  })

  it('moves funds in two currencies and freezes amounts across reload and rebase', () => {
    let before = fixture({
      assignments: [
        { id: PARENT, month: MONTH, value: 100 },
        { id: OTHER, month: MONTH, value: 50 },
      ],
    })
    before = apply(
      before,
      compilePatchEnvelopeMeta(before, { id: OTHER, currency: 'EUR' }, ctx)
    )
    const store = storeFor(before)
    store.dispatch(
      core.budgets.moveFunds({
        from: PARENT,
        to: OTHER,
        month: MONTH,
        money: { amount: 20, currency: 'USD' },
      })
    )
    const metrics = core.activity.selectEnvelopeMetrics(store.getState())[MONTH]
    expect(metrics[PARENT].selfAssigned.USD).toBe(80)
    expect(metrics[OTHER].selfAssigned.EUR).toBe(60)
    expectSingleUndo(store, before)
    const remote = {
      ...before,
      instrument: {
        ...before.instrument,
        2: { ...before.instrument[2], rate: 4 },
      },
    }
    const current = replayOutbox(
      remote,
      parseCommandOutbox(
        JSON.parse(JSON.stringify(store.getState().data.outbox))
      )
    )
    const rebased = core.budgets.selectAll(makeTestRootState(current))[MONTH]
    expect(rebased[PARENT]).toBe(80)
    expect(rebased[OTHER]).toBe(60)
  })

  it('moves funds to and from unassigned, and never records a same-envelope transfer', () => {
    const before = fixture()
    const store = storeFor(before)
    expect(
      store.dispatch(
        core.budgets.moveFunds({
          from: PARENT,
          to: PARENT,
          month: MONTH,
          money: { amount: 20, currency: 'USD' },
        })
      ).status
    ).toBe('noop')
    store.dispatch(
      core.budgets.moveFunds({
        from: 'toBeAssigned',
        to: PARENT,
        month: MONTH,
        money: { amount: 20, currency: 'USD' },
      })
    )
    expectSingleUndo(store, before)
    store.dispatch(
      core.budgets.moveFunds({
        from: PARENT,
        to: 'toBeAssigned',
        month: MONTH,
        money: { amount: 20, currency: 'USD' },
      })
    )
    expect(
      core.activity.selectEnvelopeMetrics(store.getState())[MONTH][PARENT]
        .selfAssigned.USD
    ).toBe(0)
  })

  it('recalculates the selected preset at execution instead of writing its displayed amount', () => {
    const before = fixture({
      assignments: [
        { id: PARENT, month: MONTH, value: 90 },
        { id: CHILD, month: MONTH, value: 10 },
      ],
    })
    const store = storeFor(before)
    expect(
      core.budgets
        .selectPresets(store.getState(), MONTH, PARENT)
        .find(p => p.kind === 'childrenAssigned')?.amount
    ).toBe(10)
    store.dispatch(
      core.budgets.setTotalAssigned({ id: CHILD, month: MONTH, amount: 20 })
    )
    const pending = store.getState().data.outbox.length
    store.dispatch(
      core.budgets.applyPreset({
        id: PARENT,
        month: MONTH,
        kind: 'childrenAssigned',
      })
    )
    expect(
      core.activity.selectEnvelopeMetrics(store.getState())[MONTH][PARENT]
        .totalAssigned.USD
    ).toBe(20)
    expect(store.getState().data.outbox).toHaveLength(pending + 1)
    expect(store.getState().data.outbox.at(-1)?.label?.verb).toBe(
      'budget-children-assigned'
    )
  })

  it('does not mutate state or discard redo on noop or a failure after the first planned write', () => {
    const before = fixture()
    const store = storeFor(before)
    store.dispatch(
      core.budgets.setTotalAssigned({ id: PARENT, month: MONTH, amount: 20 })
    )
    store.dispatch(undoClientCommand())
    const state = store.getState()
    expect(store.dispatch(core.budgets.fundGoals(MONTH)).status).toBe('noop')
    expect(() =>
      store.dispatch(
        core.budgets.moveFunds({
          from: PARENT,
          to: 'tag#missing',
          month: MONTH,
          money: { amount: 20, currency: 'USD' },
        })
      )
    ).toThrow('Envelope')
    expect(store.getState()).toBe(state)
    expect(store.getState().data.redo).toHaveLength(1)
    expect(() =>
      store.dispatch(
        core.budgets.setTotalAssigned({ id: PARENT, month: MONTH, amount: NaN })
      )
    ).toThrow('finite')
    expect(() => store.dispatch(core.budgets.fundGoals('2026-13'))).toThrow(
      'month'
    )
    expect(store.getState()).toBe(state)
  })

  it.each(['outbox', 'journal', 'history'])(
    'notifies once when %s blocks a command',
    reason => {
      const notify = vi.spyOn(toast, 'add').mockReturnValue('blocked-toast')
      const state = makeTestRootState(fixture())
      if (reason === 'outbox')
        state.data.outboxRecoveryReason = 'corrupt outbox'
      if (reason === 'journal') state.data.journalRecoveryRequired = true
      if (reason === 'history')
        state.history = {
          ...state.history,
          selection: {
            status: 'ready',
            point: { kind: 'journal', sequence: 1 },
            snapshot: state.data.current,
          },
        }
      const store = configureStore({
        reducer: rootReducer,
        preloadedState: state,
      })
      expect(store.dispatch(core.budgets.fundGoals(MONTH)).status).toBe(
        'blocked'
      )
      expect(store.getState().data.outbox).toHaveLength(0)
      expect(store.getState()).toBe(state)
      expect(notify).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ type: 'error' })
      )
    }
  )
})
