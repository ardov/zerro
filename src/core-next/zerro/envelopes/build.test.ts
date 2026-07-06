import { describe, expect, it } from 'vitest'
import type { TAccount, TTag } from '6-shared/types'
import { EnvType, envId } from '../envelope-id'
import { envelopeVisibility } from '../envelope-meta'
import { buildEnvelopes, defaultEnvelopeGroupIds, getKeepingEnvelopes } from './build'

describe('buildEnvelopes', () => {
  it('builds envelopes from prepared inputs and applies structure fields', () => {
    const parentId = envId.get(EnvType.Tag, 'food')
    const childId = envId.get(EnvType.Tag, 'cafes')
    const accountId = envId.get(EnvType.Account, 'safe')

    const result = buildEnvelopes({
      userCurrency: 'USD',
      populatedTags: {
        null: tag({ id: 'null', title: 'No category', name: 'No category' }),
        food: tag({ id: 'food', title: 'Food', name: 'Food', showOutcome: true }),
        cafes: tag({
          id: 'cafes',
          title: 'Cafes',
          name: 'Cafes',
          parent: 'food',
        }),
      },
      savingAccounts: [account({ id: 'safe', title: 'Safe' })],
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
      symbol: '🏦',
    })
    expect(getKeepingEnvelopes(result.byId)).toEqual([parentId])
  })

  it('uses stable default group ids for debtors', () => {
    const merchantId = envId.get(EnvType.Merchant, 'merchant-1')
    const payeeId = envId.get(EnvType.Payee, 'alex')

    const result = buildEnvelopes({
      userCurrency: 'USD',
      populatedTags: {},
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

    expect(result.byId[merchantId].group).toBe(defaultEnvelopeGroupIds.merchants)
    expect(result.byId[payeeId].group).toBe(defaultEnvelopeGroupIds.payees)
  })
})

function tag(patch: Partial<TTag> & { id: string; title: string; name: string }) {
  return {
    changed: 1,
    user: 1,
    parent: null,
    icon: null,
    staticId: null,
    picture: null,
    color: null,
    showIncome: true,
    showOutcome: false,
    budgetIncome: true,
    budgetOutcome: true,
    required: null,
    symbol: '?',
    children: [],
    colorHEX: null,
    colorDisplay: '#cccccc',
    ...patch,
  }
}

function account(patch: Partial<TAccount> & { id: string; title: string }) {
  return {
    changed: 1,
    user: 1,
    instrument: 1,
    role: null,
    company: null,
    type: 'deposit',
    syncID: null,
    balance: 0,
    startBalance: 0,
    creditLimit: 0,
    inBalance: false,
    savings: false,
    enableCorrection: false,
    enableSMS: false,
    archive: false,
    private: false,
    capitalization: null,
    percent: null,
    startDate: null,
    endDateOffset: null,
    endDateOffsetInterval: null,
    payoffStep: null,
    payoffInterval: null,
    ...patch,
  } as TAccount
}
