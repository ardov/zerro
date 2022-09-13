import { createSelector } from '@reduxjs/toolkit'
import { ById } from '@shared/types'
import { TSelector } from '@store'
import { getSavingAccounts } from '@entities/account'
import { getDebtors } from '@entities/debtors'
import { getUserCurrencyCode } from '@entities/instrument'
import { getPopulatedTags } from '@entities/tag'
import { getEnvelopeMeta } from './shared/metaData'
import { makeEnvelope, TEnvelope } from './shared/makeEnvelope'
import {
  getRightParent,
  buildStructure,
  flattenStructure,
} from './shared/structure'
import { compareEnvelopes } from './shared/compareEnvelopes'

const getCompiledEnvelopes: TSelector<{
  byId: ById<TEnvelope>
  structure: ReturnType<typeof buildStructure>
}> = createSelector(
  [
    getDebtors,
    getPopulatedTags,
    getSavingAccounts,
    getEnvelopeMeta,
    getUserCurrencyCode,
  ],
  (debtors, tags, savingAccounts, envelopeMeta, userCurrency) => {
    let result: ById<TEnvelope> = {}

    // Step 1. Create envelopes from tags, saving accounts and debtors
    Object.values(tags).forEach(tag => {
      const e = makeEnvelope.tag(tag, envelopeMeta, userCurrency)
      result[e.id] = e
    })
    savingAccounts.forEach(account => {
      const e = makeEnvelope.account(account, envelopeMeta, userCurrency)
      result[e.id] = e
    })
    Object.values(debtors).forEach(debtor => {
      const e = makeEnvelope.debtor(debtor, envelopeMeta, userCurrency)
      result[e.id] = e
    })

    // Step 2. Update indices, prepare for building tree
    const list = Object.values(result)
      .sort(compareEnvelopes)
      .map((e, i) => {
        // update index (to compare later)
        e.index = i
        // Fix nesting issues (only 2 levels are allowed)
        e.parent = getRightParent(e.parent, result)
        if (e.parent) {
          const parent = result[e.parent]
          // Attach child to parent
          parent.children.push(e.id)
          // Inherit group names from parents
          e.group = result[e.parent].group
        }
        return e
      })

    // Step 3. Build structure and update indicies according to it
    const structure = buildStructure(result)
    const flatList = flattenStructure(structure)
    // Update indicies
    flatList.forEach(({ id, type }, index) => {
      if (type === 'envelope') result[id].index = index
    })

    return {
      byId: result,
      structure,
    }
  }
)

export const getEnvelopes: TSelector<ById<TEnvelope>> = state =>
  getCompiledEnvelopes(state).byId

export const getEnvelopeStructure: TSelector<
  ReturnType<typeof buildStructure>
> = state => getCompiledEnvelopes(state).structure
