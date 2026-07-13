export {
  applyEnvelopeStructure as applyStructure,
  createEnvelope as create,
  renameEnvelope as rename,
  setEnvelopeColor as setColor,
  setEnvelopeComment as setComment,
  updateEnvelopeSettings as updateSettings,
} from './commands'
import { createSelector } from '@reduxjs/toolkit'
import { i18n } from '6-shared/localization'
import type { RootState } from 'store'
import {
  buildEnvelopes,
  getEnvelopeMeta,
  getKeepingEnvelopes,
  getZerroSavingAccounts,
} from '../domain/zerro'
import * as debtors from './debtors'
import { presentEnvelopes, type TEnvelopeLabels } from './envelopePresentation'
import { selectAccountSlice, selectReminderSlice } from './state'
import * as tags from './tags'
import * as users from './users'

const selectEnvelopeMeta = createSelector([selectReminderSlice], reminder =>
  getEnvelopeMeta({ reminder })
)
const selectDomainProjection = createSelector(
  [
    debtors.selectAll,
    tags.selectStructure,
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
let labelsCacheLanguage: string | undefined
let labelsCache: TEnvelopeLabels | undefined
const selectLabels = () => {
  if (labelsCache && labelsCacheLanguage === i18n.language) return labelsCache
  labelsCacheLanguage = i18n.language
  labelsCache = {
    defaultTagGroup: i18n.t('defaultTagGroup', { ns: 'common' }),
    defaultAccountGroup: i18n.t('defaultAccountGroup', { ns: 'common' }),
    defaultMerchantGroup: i18n.t('defaultMerchantGroup', { ns: 'common' }),
    defaultPayeeGroup: i18n.t('defaultPayeeGroup', { ns: 'common' }),
  }
  return labelsCache
}
const selectPresentedProjection = createSelector(
  [selectDomainProjection, tags.selectPopulated, selectLabels],
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
