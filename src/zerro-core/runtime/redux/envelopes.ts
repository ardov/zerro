export { patchEnvelopeMeta as patchMeta } from './commands'
export {
  applyEnvelopeStructure as applyStructure,
  createEnvelope as create,
  renameEnvelope as rename,
  setEnvelopeAppearance as setAppearance,
  setEnvelopeComment as setComment,
  updateEnvelopeSettings as updateSettings,
} from './commands'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { fromGraph, graph } from './graph'
import { getCommandEnvelopeLabels } from './commandRead'
import {
  presentEnvelopes,
  type TPresentedEnvelope,
} from './envelopePresentation'
import type { TEnvelopeId } from '../../internal/domain/zerro'
import * as tags from './tags'

export const selectDomain = fromGraph(graph.envelopes)
export const selectDomainStructure = fromGraph(graph.envelopeStructure)
// Unchanged envelopes keep their objects, so a colour drag re-renders one row.
let lastById: Partial<Record<TEnvelopeId, TPresentedEnvelope>> = {}
const selectPresentedProjection = createSelector(
  [selectDomain, tags.selectPopulated, getCommandEnvelopeLabels],
  (domainById, tags, labels) => {
    const projection = presentEnvelopes(domainById, tags, labels)
    for (const envelope of Object.values(projection.byId)) {
      const previous = lastById[envelope.id]
      if (previous && samePresentedEnvelope(previous, envelope))
        projection.byId[envelope.id] = previous
    }
    lastById = projection.byId
    return projection
  }
)

function samePresentedEnvelope(a: TPresentedEnvelope, b: TPresentedEnvelope) {
  return (Object.keys(b) as (keyof TPresentedEnvelope)[]).every(key =>
    key === 'children'
      ? a.children.length === b.children.length &&
        a.children.every((id, index) => id === b.children[index])
      : a[key] === b[key]
  )
}
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
  hasEditableAppearance,
  toEnvelopeStructureInput,
  type TEnvelopeId,
  type TEnvelopeStructureNodeInput,
  type TEnvNode,
  type TGroupNode,
} from '../../internal/domain/zerro'
