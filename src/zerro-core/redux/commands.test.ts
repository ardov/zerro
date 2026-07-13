import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import type { TCoreContext, TNormalizedPatch } from '../types'
import { appendClientOutboxEntry } from 'store/data'
import { makeDemoStore } from '../demo'
import { makeTestRootState } from '../testing/rootState'
import {
  applyPatch,
  compileApplyChangesToTransaction,
  compileBulkEditTransactions,
  compileCombineToOutcome,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMarkTransactionsViewed,
  compilePatchAccount,
  compileRestoreTransaction,
} from '../domain/zenmoney'
import { makeStore, makeTransaction } from '../testing/zenmoneyTestData'
import {
  compileRenameEnvelope,
  compileSetEnvelopeColor,
  compileSetEnvelopeComment,
  envId,
  EnvType,
  getEnvelopeMeta,
  getStoredFxRates,
  getUserSettings,
  toEnvelopeStructureInput,
} from '../domain/zerro'
import {
  compileAppCommand,
  recreateTransaction,
  type TAppCommand,
} from './commands'
import {
  selectEnvelopes,
  selectEnvelopeStructure,
} from '../testing/reduxSelectors'

const NOW = Date.parse('2026-07-10T12:00:00Z')

// A fresh deterministic context per call keeps uuid sequences identical when a
// command is compiled twice (through the funnel and directly), so equivalence
// assertions stay byte-for-byte stable.
const makeCtx = (): TCoreContext => {
  let counter = 0
  return { now: () => NOW, uuid: () => `id-${counter++}` }
}

const makeState = makeTestRootState

function makeDispatch(state: RootState) {
  const dispatch: any = vi.fn(action =>
    typeof action === 'function'
      ? action(dispatch, () => state, undefined)
      : action
  )
  return dispatch
}

// Pass-through commands do nothing but unpack their payload and hand it to a
// domain compiler. Testing that the funnel produces the same patch as calling
// the compiler directly pins the routing (right compiler, right argument order)
// without duplicating the domain semantics — these cases track the domain
// suites automatically when behavior changes.
const routingCases: Array<{
  name: string
  make: () => {
    data: TDataStore
    command: TAppCommand
    direct: (ctx: TCoreContext) => TNormalizedPatch
  }
}> = [
  {
    name: 'transaction delete',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.transaction)
      return {
        data,
        command: {
          type: 'zenmoney.transaction.delete',
          payload: { ids: [id] },
        },
        direct: ctx => compileDeleteTransactions(data, [id], ctx),
      }
    },
  },
  {
    name: 'permanent transaction delete',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.transaction)
      return {
        data,
        command: {
          type: 'zenmoney.transaction.delete.permanent',
          payload: { ids: [id] },
        },
        direct: ctx => compileDeleteTransactionsPermanently(data, [id], ctx),
      }
    },
  },
  {
    name: 'transaction restore',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.transaction)
      return {
        data,
        command: { type: 'zenmoney.transaction.restore', payload: { id } },
        direct: ctx => compileRestoreTransaction(data, id, ctx),
      }
    },
  },
  {
    name: 'mark transactions viewed',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.transaction)
      return {
        data,
        command: {
          type: 'zenmoney.transaction.viewed.set',
          payload: { ids: [id], viewed: false },
        },
        direct: ctx => compileMarkTransactionsViewed(data, [id], false, ctx),
      }
    },
  },
  {
    name: 'transaction update',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.transaction)
      const patch = { id, comment: 'Edited through command' }
      return {
        data,
        command: { type: 'zenmoney.transaction.update', payload: patch },
        direct: ctx => compileApplyChangesToTransaction(data, patch, ctx),
      }
    },
  },
  {
    name: 'bulk transaction edit',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const ids = Object.keys(data.transaction).slice(0, 2)
      const [tagId] = Object.keys(data.tag)
      return {
        data,
        command: {
          type: 'zenmoney.transaction.bulk.edit',
          payload: { ids, tags: [tagId], comment: 'Bulk comment' },
        },
        direct: ctx =>
          compileBulkEditTransactions(
            data,
            ids,
            { tags: [tagId], comment: 'Bulk comment' },
            ctx
          ),
      }
    },
  },
  {
    name: 'account budget participation',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const [id] = Object.keys(data.account)
      const inBalance = !data.account[id].inBalance
      return {
        data,
        command: {
          type: 'zenmoney.account.inBalance.set',
          payload: { id, inBalance },
        },
        direct: ctx => compilePatchAccount(data, { id, inBalance }, ctx),
      }
    },
  },
  {
    name: 'envelope rename',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const id = envId.get(EnvType.Tag, Object.keys(data.tag)[0])
      const payload = { id, name: 'Renamed through command' }
      return {
        data,
        command: { type: 'zerro.envelope.rename', payload },
        direct: ctx => compileRenameEnvelope(data, payload, ctx),
      }
    },
  },
  {
    name: 'envelope color',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const id = envId.get(EnvType.Tag, Object.keys(data.tag)[0])
      const payload = { id, colorHex: '#00ff00' }
      return {
        data,
        command: { type: 'zerro.envelope.color.set', payload },
        direct: ctx => compileSetEnvelopeColor(data, payload, ctx),
      }
    },
  },
  {
    name: 'envelope comment',
    make: () => {
      const data = makeDemoStore({ now: NOW })
      const id = envId.get(EnvType.Tag, Object.keys(data.tag)[0])
      const payload = { id, comment: 'Semantic note' }
      return {
        data,
        command: { type: 'zerro.envelope.comment.set', payload },
        direct: ctx => compileSetEnvelopeComment(data, payload, ctx),
      }
    },
  },
  {
    name: 'combine to outcome',
    make: () => {
      const data = makeStore({
        transaction: {
          out: makeTransaction({
            id: 'out',
            income: 0,
            outcome: 100,
            outcomeInstrument: 1,
            outcomeAccount: 'card',
          }),
          in: makeTransaction({
            id: 'in',
            income: 40,
            incomeInstrument: 1,
            incomeAccount: 'card',
            outcome: 0,
          }),
        },
      })
      return {
        data,
        command: {
          type: 'zenmoney.transaction.combineToOutcome',
          payload: { ids: ['out', 'in'] },
        },
        direct: ctx => compileCombineToOutcome(data, ['out', 'in'], ctx),
      }
    },
  },
]

describe('command funnel routing', () => {
  it.each(routingCases)(
    'routes $name through the matching domain compiler',
    ({ make }) => {
      const { data, command, direct } = make()

      expect(compileAppCommand(makeState(data), command, makeCtx())).toEqual(
        direct(makeCtx())
      )
    }
  )
})

// The remaining tests cover funnel-only behavior: payload adaptation and
// receipts that the domain compilers never see.
describe('command funnel adaptation', () => {
  it('merges an FX edit with the selected month rates', () => {
    const current = makeDemoStore({ now: NOW })
    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        {
          type: 'zerro.fxRates.edit',
          payload: { month: '2026-07', patch: { EUR: 0.75 } },
        },
        { now: () => NOW, uuid: () => 'fx-rates-id' }
      )
    )

    expect(getStoredFxRates(next)['2026-07']).toMatchObject({
      date: '2026-07',
      changed: NOW,
      rates: expect.objectContaining({ EUR: 0.75 }),
    })
  })

  it.each([
    ['zerro.userSettings.emojiIcons.set', 'emojiIcons'],
    ['zerro.userSettings.preferZmBudgets.set', 'preferZmBudgets'],
  ] as const)('sets one user setting through %s', (type, key) => {
    const current = makeDemoStore({ now: NOW })
    const next = applyPatch(
      current,
      compileAppCommand(
        makeState(current),
        { type, payload: { enabled: true } },
        { now: () => NOW, uuid: () => 'settings-id' }
      )
    )

    expect(getUserSettings(next)[key]).toBe(true)
  })

  it('normalizes unchanged presented null-tag settings to domain values', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const id = envId.get(EnvType.Tag, null)
    const presented = selectEnvelopes(state)[id]

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.settings.update',
        payload: {
          id,
          name: presented.originalName,
          colorHex: presented.colorHex,
          currency: presented.currency,
          visibility: presented.visibility,
          keepIncome: presented.keepIncome,
        },
      },
      { now: () => NOW, uuid: () => 'unused' }
    )

    expect(patch).toEqual({})
  })

  it('translates the presented group label when moving an envelope', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const input = toEnvelopeStructureInput(selectEnvelopeStructure(state))
    const [moved, ...restChildren] = input[0].children

    const patch = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.structure.apply',
        payload: [
          { ...input[0], children: restChildren },
          ...input.slice(1),
          { group: 'Custom', children: [moved] },
        ],
      },
      { now: () => NOW, uuid: () => 'structure-meta' }
    )
    const next = applyPatch(current, patch)
    const nextStructure = selectEnvelopeStructure(makeState(next))
    const lastGroup = nextStructure[nextStructure.length - 1]

    expect(getEnvelopeMeta(next)[moved.id]).toMatchObject({ group: 'Custom' })
    expect(lastGroup.id).toBe('Custom')
    expect(lastGroup.children.map(child => child.id)).toContain(moved.id)
  })

  it('normalizes an unchanged structure to an empty patch after indices settle', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const ctx = { now: () => NOW, uuid: () => 'structure-meta' }

    // The first identity apply may materialize implicit indices.
    const first = compileAppCommand(
      state,
      {
        type: 'zerro.envelope.structure.apply',
        payload: toEnvelopeStructureInput(selectEnvelopeStructure(state)),
      },
      ctx
    )
    const settled = makeState(applyPatch(current, first))

    // Presented default group labels normalize back to domain ids, so an
    // identity apply never writes groups or parents — only indices.
    Object.values(getEnvelopeMeta(settled.data.current)).forEach(meta => {
      expect(meta.group).toBeUndefined()
      expect(meta.parent).toBeUndefined()
    })

    const second = compileAppCommand(
      settled,
      {
        type: 'zerro.envelope.structure.apply',
        payload: toEnvelopeStructureInput(selectEnvelopeStructure(settled)),
      },
      ctx
    )
    expect(second).toEqual({})
  })

  it('recreates a transaction and returns the new id as a receipt', () => {
    const current = makeDemoStore({ now: NOW })
    const state = makeState(current)
    const [id] = Object.keys(current.transaction)
    const dispatch = makeDispatch(state)

    const newId = dispatch(recreateTransaction({ id, comment: 'Recreated' }))

    const entries = dispatch.mock.calls
      .map(([action]: [any]) => action)
      .filter((action: any) => action?.type === appendClientOutboxEntry.type)
    expect(entries).toHaveLength(1)
    const [oldTr, newTr] = entries[0].payload.appliedPatch.transaction
    expect(newId).toBe(newTr.id)
    expect(newId).not.toBe(id)
    expect(oldTr).toMatchObject({ id, income: 0.00001, outcome: 0.00001 })
    expect(newTr.comment).toBe('Recreated')
  })
})
