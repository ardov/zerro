import { describe, expect, it } from 'vitest'
import { i18n } from '6-shared/localization'
import { makeDemoStore } from '../demo'
import { makeTestRootState } from '../testing/rootState'
import { applyPatch } from '../domain/zenmoney'
import {
  compilePatchEnvelopeMeta,
  defaultEnvelopeGroupIds,
  envId,
  EnvType,
} from '../domain/zerro'

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
  return import('../testing/reduxSelectors')
}

const makeRootState = makeTestRootState

describe('selectEnvelopes chain', () => {
  it('keeps appearance out of domain envelopes and adds it in the adapter', async () => {
    const { selectDomainEnvelopes, selectEnvelopes } =
      await importModels()
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

  it('builds stable envelope structure on demo data', async () => {
    const {
      selectEnvelopes,
      selectEnvelopeStructure,
      selectKeepingEnvelopeIds,
    } = await importModels()
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(Object.keys(selectEnvelopes(state))).not.toHaveLength(0)
    expect(selectEnvelopeStructure(state)).toEqual(expect.any(Array))
    expect(selectKeepingEnvelopeIds(state)).toEqual(expect.any(Array))
  })

  it('applies envelope metadata', async () => {
    const { selectEnvelopes } = await importModels()
    const store = makeDemoStore({ now: NOW })
    const tagId = Object.keys(store.tag)[0]
    const envelopeId = envId.get(EnvType.Tag, tagId)

    const metaPatch = compilePatchEnvelopeMeta(
      store,
      { id: envelopeId, comment: 'zerro-core test comment' },
      ctx
    )
    const state = makeRootState(applyPatch(store, metaPatch))

    const core = selectEnvelopes(state)
    expect(core[envelopeId].comment).toBe('zerro-core test comment')
  })

  it('stays cached across unrelated data changes', async () => {
    const { selectEnvelopes, selectEnvelopeStructure } =
      await importModels()
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
