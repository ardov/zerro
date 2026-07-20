export {
  applyEnvelopeStructure as applyStructure,
  createEnvelope as create,
  renameEnvelope as rename,
  setEnvelopeColor as setColor,
  setEnvelopeComment as setComment,
  updateEnvelopeSettings as updateSettings,
} from './commands'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import { buildEnvelopes, getKeepingEnvelopes } from '../domain/zerro'
import { graph } from './graph'
import { getCommandEnvelopeLabels } from './commandRead'
import * as debtors from './debtors'
import { presentEnvelopes } from './envelopePresentation'
import { selectTagSlice } from './state'
import * as tags from './tags'
import * as users from './users'

const selectDomainProjection = createSelector(
  [
    debtors.selectAll,
    selectTagSlice,
    (state: RootState) => graph.savingAccounts(state.data.current),
    (state: RootState) => graph.envelopeMeta(state.data.current),
    users.selectCurrency,
  ],
  (debtors, tags, savingAccounts, envelopeMeta, userCurrency) =>
    buildEnvelopes({
      debtors,
      tags,
      savingAccounts,
      envelopeMeta,
      userCurrency,
    })
)
export const selectDomain = (state: RootState) =>
  selectDomainProjection(state).byId
export const selectDomainStructure = (state: RootState) =>
  selectDomainProjection(state).structure
const selectPresentedProjection = createSelector(
  [selectDomainProjection, tags.selectPopulated, getCommandEnvelopeLabels],
  (compiled, tags, labels) => presentEnvelopes(compiled.byId, tags, labels)
)
export const selectAll = (state: RootState) =>
  selectPresentedProjection(state).byId
export const selectStructure = (state: RootState) =>
  selectPresentedProjection(state).structure
export const selectKeepingIds = createSelector(
  [selectDomain],
  getKeepingEnvelopes
)
export type { TPresentedEnvelope } from './envelopePresentation'
export {
  envId,
  EnvType,
  flattenStructure,
  toEnvelopeStructureInput,
  type TEnvelopeStructureNodeInput,
  type TEnvNode,
  type TGroupNode,
} from '../domain/zerro'
