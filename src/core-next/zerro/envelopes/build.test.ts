import { describe, expect, it } from 'vitest'
import { makeAccount } from '../../testing/zenmoneyTestData'
import { EnvType, envId } from '../envelope-id'
import { envelopeVisibility } from '../envelope-meta'
import {
  buildEnvelopes,
  defaultEnvelopeGroupIds,
  getKeepingEnvelopes,
  type TEnvelopeTag,
  uncategorizedEnvelopeName,
} from './build'

describe('buildEnvelopes', () => {
  it('builds envelopes from prepared inputs and applies structure fields', () => {
    const parentId = envId.get(EnvType.Tag, 'food')
    const childId = envId.get(EnvType.Tag, 'cafes')
    const accountId = envId.get(EnvType.Account, 'safe')

    const result = buildEnvelopes({
      userCurrency: 'USD',
      tags: {
        null: tag({ id: 'null', title: 'No category', name: 'No category' }),
        food: tag({
          id: 'food',
          title: 'Food',
          name: 'Food',
          showOutcome: true,
        }),
        cafes: tag({
          id: 'cafes',
          title: 'Cafes',
          name: 'Cafes',
          parent: 'food',
        }),
      },
      savingAccounts: [makeAccount({ id: 'safe', title: 'Safe' })],
      debtors: {},
      envelopeMeta: {
        [parentId]: {
          id: parentId,
          group: 'Everyday',
          keepIncome: true,
          index: 2,
        },
        [accountId]: {
          id: accountId,
          visibility: envelopeVisibility.hidden,
          currency: 'EUR',
          index: 1,
        },
      },
    })

    expect(result.byId[parentId]).toMatchObject({
      id: parentId,
      type: EnvType.Tag,
      group: 'Everyday',
      visibility: envelopeVisibility.visible,
      children: [childId],
      parent: null,
      index: 3,
      keepIncome: true,
    })
    expect(result.byId[childId]).toMatchObject({
      parent: parentId,
      group: 'Everyday',
      currency: 'USD',
    })
    expect(result.byId[accountId]).toMatchObject({
      group: defaultEnvelopeGroupIds.accounts,
      visibility: envelopeVisibility.hidden,
      currency: 'EUR',
    })
    expect(getKeepingEnvelopes(result.byId)).toEqual([parentId])
  })

  it('uses stable default group ids for debtors', () => {
    const merchantId = envId.get(EnvType.Merchant, 'merchant-1')
    const payeeId = envId.get(EnvType.Payee, 'alex')

    const result = buildEnvelopes({
      userCurrency: 'USD',
      tags: {},
      savingAccounts: [],
      envelopeMeta: {},
      debtors: {
        merchant: {
          id: 'merchant',
          name: 'Shop',
          merchantId: 'merchant-1',
          merchantName: 'Shop',
          payeeNames: [],
          transactions: [],
          balance: {},
        },
        alex: {
          id: 'alex',
          name: 'Alex',
          payeeNames: ['Alex'],
          transactions: [],
          balance: {},
        },
      },
    })

    expect(result.byId[merchantId].group).toBe(
      defaultEnvelopeGroupIds.merchants
    )
    expect(result.byId[payeeId].group).toBe(defaultEnvelopeGroupIds.payees)
  })

  it('creates the uncategorized envelope without adapter-provided null tag', () => {
    const nullTagId = envId.get(EnvType.Tag, null)

    const result = buildEnvelopes({
      userCurrency: 'USD',
      tags: {},
      savingAccounts: [],
      envelopeMeta: {},
      debtors: {},
    })

    expect(result.byId[nullTagId]).toMatchObject({
      id: nullTagId,
      type: EnvType.Tag,
      entityId: 'null',
      name: uncategorizedEnvelopeName,
      originalName: uncategorizedEnvelopeName,
      colorHex: null,
      group: defaultEnvelopeGroupIds.tags,
      parent: null,
      currency: 'USD',
    })
    expect(result.structure[0]).toMatchObject({
      id: defaultEnvelopeGroupIds.tags,
      children: [{ id: nullTagId }],
    })
    expect(result.byId[nullTagId]).not.toHaveProperty('symbol')
    expect(result.byId[nullTagId]).not.toHaveProperty('colorDisplay')
  })
})

function tag(
  patch: Partial<TEnvelopeTag> & { id: string; title: string; name: string }
): TEnvelopeTag {
  return {
    parent: null,
    showOutcome: false,
    colorHex: null,
    ...patch,
  }
}
