import { shallowEqual } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { ById } from '6-shared/types'
import { withPerf } from '6-shared/helpers/performance'
import { keys } from '6-shared/helpers/keys'

import { TSelector } from 'store'
import { accountModel } from '5-entities/account'
import { debtorModel } from '5-entities/debtors'
import { tagModel } from '5-entities/tag'
import { userModel } from '5-entities/user'

import { makeEnvelope, TEnvelope } from './shared/makeEnvelope'
import { getEnvelopeMeta } from './shared/metaData'
import { buildStructure, flattenStructure } from './shared/structure'
import { TEnvelopeId } from './shared/envelopeId'

const getCompiledEnvelopes: TSelector<{
  byId: ById<TEnvelope>
  structure: ReturnType<typeof buildStructure>
}> = createSelector(
  [
    debtorModel.getDebtors,
    tagModel.getPopulatedTags,
    accountModel.getSavingAccounts,
    getEnvelopeMeta,
    userModel.getUserCurrency,
  ],
  withPerf(
    'getCompiledEnvelopes',
    (debtors, tags, savingAccounts, envelopeMeta, userCurrency) => {
      let envelopes: ById<TEnvelope> = {}

      // Step 1. Create envelopes from tags, saving accounts and debtors
      Object.values(tags).forEach(tag => {
        const e = makeEnvelope.tag(tag, envelopeMeta, userCurrency)
        envelopes[e.id] = e
      })
      savingAccounts.forEach(account => {
        const e = makeEnvelope.account(account, envelopeMeta, userCurrency)
        envelopes[e.id] = e
      })
      Object.values(debtors).forEach(debtor => {
        const e = makeEnvelope.debtor(debtor, envelopeMeta, userCurrency)
        envelopes[e.id] = e
      })

      // Step 2. Build a valid structure
      const structure = buildStructure(envelopes)

      // Step 3. Apply parameters from structure to envelopes
      flattenStructure(structure).forEach((node, index) => {
        // Skip groups
        if (node.type === 'group') return
        // Update envelope props from valid structure
        const envelope = envelopes[node.id]
        envelope.parent = node.parent
        envelope.group = node.group
        envelope.children = node.children.map(child => child.id)
        envelope.index = index // Update indicies
      })

      return { byId: envelopes, structure }
    }
  )
)

export const getEnvelopes: TSelector<ById<TEnvelope>> = state =>
  getCompiledEnvelopes(state).byId

export const getEnvelopeStructure: TSelector<
  ReturnType<typeof buildStructure>
> = state => getCompiledEnvelopes(state).structure

/** List of envelopes that keep their income */
export const getKeepingEnvelopes: TSelector<TEnvelopeId[]> = createSelector(
  [getEnvelopes],
  envelopes => keys(envelopes).filter(id => envelopes[id].keepIncome),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
)
