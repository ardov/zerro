export {
  applyEnvelopeStructure as applyStructure,
  createEnvelope as create,
  renameEnvelope as rename,
  setEnvelopeColor as setColor,
  setEnvelopeComment as setComment,
  updateEnvelopeSettings as updateSettings,
} from './commands'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { fromGraph, graph } from './graph'
import { getCommandEnvelopeLabels } from './commandRead'
import { presentEnvelopes } from './envelopePresentation'
import * as tags from './tags'

export const selectDomain = fromGraph(graph.envelopes)
export const selectDomainStructure = fromGraph(graph.envelopeStructure)
const selectPresentedProjection = createSelector(
  [selectDomain, tags.selectPopulated, getCommandEnvelopeLabels],
  (domainById, tags, labels) => presentEnvelopes(domainById, tags, labels)
)
export const selectAll = (state: RootState) =>
  selectPresentedProjection(state).byId
export const selectStructure = (state: RootState) =>
  selectPresentedProjection(state).structure
export const selectKeepingIds = fromGraph(graph.keepingEnvelopeIds)
export type { TPresentedEnvelope } from './envelopePresentation'
export {
  envId,
  EnvType,
  envelopeVisibility,
  flattenStructure,
  toEnvelopeStructureInput,
  type TEnvelopeId,
  type TEnvelopeStructureNodeInput,
  type TEnvNode,
  type TGroupNode,
} from '../../internal/domain/zerro'
