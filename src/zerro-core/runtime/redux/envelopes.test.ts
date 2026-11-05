import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from '@/store/rootReducer'
import {
  appendClientCommand,
  applyServerPatch,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
} from '@/store/data'
import {
  makeStore,
  makeTag,
  makeTransaction,
} from '../../support/testing/zenmoneyTestData'
import { setEnvelopeAppearance } from './commands'
import { materializeTestInput } from '@/zerro-core/support/testing/commandTestData'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { toast } from '@/6-shared/ui/kit/Toast'
import { i18n } from '@/6-shared/localization'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import { applyPatch } from '../../internal/domain/zenmoney'
import {
  compilePatchEnvelopeMeta,
  defaultEnvelopeGroupIds,
  envId,
  EnvType,
} from '../../internal/domain/zerro'
import {
  selectDomainEnvelopes,
  selectEnvelopes,
  selectEnvelopeStructure,
  selectKeepingEnvelopeIds,
} from '../../support/testing/reduxSelectors'

const NOW = Date.parse('2026-05-15T12:00:00Z')

const ctx = {
  now: () => NOW,
  uuid: (() => {
    let counter = 0
    return () =>
      `00000000-0000-4000-8000-${String(counter++).padStart(12, '0')}`
  })(),
}

const makeRootState = makeTestRootState

describe('selectEnvelopes chain', () => {
  beforeAll(() => i18n.changeLanguage('en'))

  it('keeps appearance out of domain envelopes and adds it in the adapter', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const id = envId.get(EnvType.Tag, null)

    const domain = selectDomainEnvelopes(state)[id]
    const presented = selectEnvelopes(state)[id]

    expect(domain).toMatchObject({
      name: 'No category',
      colorHex: null,
      group: defaultEnvelopeGroupIds.tags,
    })
    expect(domain).not.toHaveProperty('symbol')
    expect(domain).not.toHaveProperty('colorGenerated')
    expect(domain).not.toHaveProperty('colorDisplay')

    expect(presented).toMatchObject({
      symbol: expect.any(String),
      colorHex: '#ff0000',
      colorDisplay: '#ff0000',
      group: i18n.t('defaultTagGroup', { ns: 'common' }),
    })
  })

  it('builds stable envelope structure on demo data', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(Object.keys(selectEnvelopes(state))).not.toHaveLength(0)
    expect(selectEnvelopeStructure(state)).toEqual(expect.any(Array))
    expect(selectKeepingEnvelopeIds(state)).toEqual(expect.any(Set))
  })

  it('applies envelope metadata', () => {
    const store = makeDemoStore({ now: NOW })
    const tagId = Object.keys(store.tag)[0]
    const envelopeId = envId.get(EnvType.Tag, tagId)

    const metaPatch = materializeTestInput(
      store,
      compilePatchEnvelopeMeta(
        store,
        { id: envelopeId, comment: 'zerro-core test comment' },
        ctx
      ),
      NOW
    )
    const state = makeRootState(applyPatch(store, metaPatch))

    const core = selectEnvelopes(state)
    expect(core[envelopeId].comment).toBe('zerro-core test comment')
  })

  it('stays cached across unrelated data changes', () => {
    const store = makeDemoStore({ now: NOW })
    const envelopes = selectEnvelopes(makeRootState(store))
    const structure = selectEnvelopeStructure(makeRootState(store))

    // New current object, new budget slice, same tag/account/reminder slices
    const unrelatedChange = makeRootState({
      ...store,
      budget: { ...store.budget },
    })

    expect(selectEnvelopes(unrelatedChange)).toBe(envelopes)
    expect(selectEnvelopeStructure(unrelatedChange)).toBe(structure)
  })
})

describe('grouped appearance edits', () => {
  const id = envId.get(EnvType.Tag, 'food')
  function setup() {
    const tag = makeTag({ id: 'food', title: 'Food', icon: null, color: null })
    return configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({
          tag: { food: tag },
          transaction: { t: makeTransaction({ id: 't' }) },
        })
      ),
    })
  }
  it('keeps every other presented envelope while one colour changes', () => {
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({
          tag: {
            food: makeTag({ id: 'food', title: 'Food', color: null }),
            rent: makeTag({ id: 'rent', title: 'Rent', color: null }),
          },
        })
      ),
    })
    const rent = envId.get(EnvType.Tag, 'rent')
    const before = selectEnvelopes(store.getState())
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#abcdef' }, 'picker'))
    const after = selectEnvelopes(store.getState())
    expect(after[id]).not.toBe(before[id])
    expect(after[id].colorHex).toBe('#abcdef')
    expect(after[rent]).toBe(before[rent])
  })
  it('recompiles each drag frame against the cached pre-edit state instead of replaying the outbox', () => {
    const store = setup()
    store.dispatch(
      appendClientCommand({
        issuedAt: NOW,
        operations: [
          { type: 'transaction.patch', value: { id: 't', comment: 'pending' } },
        ],
      })
    )
    const transactions = store.getState().data.current.transaction
    for (const colorHex of ['#abcdef', '#000000', null]) {
      store.dispatch(setEnvelopeAppearance(id, { colorHex }, 'picker'))
      expect(store.getState().data.current.transaction).toBe(transactions)
    }
    expect(store.getState().data.outbox).toHaveLength(1)
  })
  it('merges a remote rename into the pending appearance edit', () => {
    const store = setup()
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#123456' }, 'picker'))
    const remote = {
      ...store.getState().data.base.tag.food,
      title: 'Groceries',
      icon: '1008_lunch',
    }
    store.dispatch(applyServerPatch({ tag: [remote] }))
    store.dispatch(setEnvelopeAppearance(id, { icon: '1006_pizza' }, 'picker'))
    expect(store.getState().data.outbox).toHaveLength(1)
    expect(store.getState().data.current.tag.food).toMatchObject({
      title: 'Groceries',
      color: 0x123456,
      icon: '1006_pizza',
    })
  })
  it('undoes and redoes all edits of one group as a single step', () => {
    const store = setup()
    const original = store.getState().data.current.tag.food
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#123456' }, 'picker'))
    store.dispatch(setEnvelopeAppearance(id, { icon: '1006_pizza' }, 'picker'))
    const edited = store.getState().data.current.tag.food
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.tag.food).toEqual(original)
    store.dispatch(redoClientCommand())
    expect(store.getState().data.current.tag.food).toEqual(edited)
  })
  it('drops the pending edit when the original appearance is restored', () => {
    const store = setup()
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#123456' }, 'picker'))
    store.dispatch(
      setEnvelopeAppearance(
        id,
        { colorHex: null, icon: '1006_pizza' },
        'picker'
      )
    )
    store.dispatch(setEnvelopeAppearance(id, { icon: null }, 'picker'))
    expect(store.getState().data.outbox).toHaveLength(0)
  })
  it('shows one blocked-write toast per group while dragging', () => {
    const notify = vi.spyOn(toast, 'add').mockReturnValue('blocked-toast')
    const state = makeTestRootState(
      makeStore({ tag: { food: makeTag({ id: 'food', color: null }) } })
    )
    state.data.journalRecoveryRequired = true
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: state,
    })
    for (const colorHex of ['#111111', '#222222', '#333333'])
      store.dispatch(setEnvelopeAppearance(id, { colorHex }, 'picker'))
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#444444' }, 'next'))
    expect(notify).toHaveBeenCalledTimes(2)
    expect(store.getState().data.outbox).toHaveLength(0)
    notify.mockRestore()
  })
  it('preserves a captured push and groups subsequent edits separately', () => {
    const store = setup()
    store.dispatch(setEnvelopeAppearance(id, { colorHex: '#abcdef' }, 'picker'))
    store.dispatch(prepareClientSync())
    const captured = store.getState().data.outbox[0]
    store.dispatch(setEnvelopeAppearance(id, { icon: '1006_pizza' }, 'picker'))
    store.dispatch(setEnvelopeAppearance(id, { colorHex: null }, 'picker'))
    expect(store.getState().data.outbox).toHaveLength(2)
    expect(store.getState().data.outbox[0]).toBe(captured)
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.tag.food).toMatchObject({
      color: 0xabcdef,
      icon: null,
    })
  })
})
