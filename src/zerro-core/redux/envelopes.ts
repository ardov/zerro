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
import {
  buildEnvelopes,
  getEnvelopeMeta,
  getKeepingEnvelopes,
  getZerroSavingAccounts,
} from '../domain/zerro'
import { getCommandEnvelopeLabels } from './commandRead'
import * as debtors from './debtors'
import { presentEnvelopes } from './envelopePresentation'
import {
  selectAccountSlice,
  selectReminderSlice,
  selectTagSlice,
} from './state'
import * as tags from './tags'
import * as users from './users'

const selectEnvelopeMeta = createSelector([selectReminderSlice], reminder =>
  getEnvelopeMeta({ reminder })
)
const selectDomainProjection = createSelector(
  [
    debtors.selectAll,
    selectTagSlice,
    selectAccountSlice,
    selectEnvelopeMeta,
    users.selectCurrency,
  ],
  (debtors, tags, account, envelopeMeta, userCurrency) =>
    buildEnvelopes({
      debtors,
      tags,
      savingAccounts: getZerroSavingAccounts({ account }),
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
