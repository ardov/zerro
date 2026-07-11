import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import { makeDemoStore } from '../../demo'
import { applyPatch } from '../../zenmoney'
import {
  compilePatchEnvelopeMeta,
  defaultEnvelopeGroupIds,
  envId,
  EnvType,
} from '../../zerro'

// Breaks the legacy hidden-store import cycle, same as the private fixture tests.
vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in this test')
  },
}))

const NOW = Date.parse('2026-05-15T12:00:00Z')

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
  const [{ envelopeModel }, selectors] = await Promise.all([
    import('5-entities/envelope'),
    import('./selectors'),
  ])
  return { envelopeModel, ...selectors }
}

function makeRootState(data: TDataStore): RootState {
  return {
    data: {
      current: data,
      base: data,
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

describe('selectCoreEnvelopes chain', () => {
  it('keeps appearance out of domain envelopes and adds it in the adapter', async () => {
    const { selectCoreDomainEnvelopes, selectCoreEnvelopes } =
      await importModels()
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const id = envId.get(EnvType.Tag, null)

    const domain = selectCoreDomainEnvelopes(state)[id]
    const presented = selectCoreEnvelopes(state)[id]

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

  it('matches legacy envelope selectors on demo data', async () => {
    const {
      envelopeModel,
      selectCoreEnvelopes,
      selectCoreEnvelopeStructure,
      selectCoreKeepingEnvelopeIds,
    } = await importModels()
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreEnvelopes(state)).toEqual(
      envelopeModel.getEnvelopes(state)
    )
    expect(selectCoreEnvelopeStructure(state)).toEqual(
      envelopeModel.getEnvelopeStructure(state)
    )
    expect(selectCoreKeepingEnvelopeIds(state)).toEqual(
      envelopeModel.getKeepingEnvelopes(state)
    )
  })

  it('matches legacy envelope selectors after a meta patch', async () => {
    const { envelopeModel, selectCoreEnvelopes } = await importModels()
    const store = makeDemoStore({ now: NOW })
    const tagId = Object.keys(store.tag)[0]
    const envelopeId = envId.get(EnvType.Tag, tagId)

    const metaPatch = compilePatchEnvelopeMeta(
      store,
      { id: envelopeId, comment: 'core-next test comment' },
      ctx
    )
    const state = makeRootState(applyPatch(store, metaPatch))

    const core = selectCoreEnvelopes(state)
    expect(core).toEqual(envelopeModel.getEnvelopes(state))
    expect(core[envelopeId].comment).toBe('core-next test comment')
  })

  it('stays cached across unrelated data changes', async () => {
    const { selectCoreEnvelopes, selectCoreEnvelopeStructure } =
      await importModels()
    const store = makeDemoStore({ now: NOW })
    const envelopes = selectCoreEnvelopes(makeRootState(store))
    const structure = selectCoreEnvelopeStructure(makeRootState(store))

    // New current object, new budget slice, same tag/account/reminder slices
    const unrelatedChange = makeRootState({
      ...store,
      budget: { ...store.budget },
    })

    expect(selectCoreEnvelopes(unrelatedChange)).toBe(envelopes)
    expect(selectCoreEnvelopeStructure(unrelatedChange)).toBe(structure)
  })
})
