import { AppThunk } from '@store'
import {
  flattenStructure,
  normalizeStructure,
  TGroupNode,
} from './shared/structure'
import { getEnvelopes } from './getEnvelopes'
import { patchEnvelope, TEnvelopeDraft } from './patchEnvelope'

export const applyStructure =
  (newStructure: TGroupNode[]): AppThunk =>
  (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    const patches = [] as TEnvelopeDraft[]
    flattenStructure(normalizeStructure(newStructure)).forEach(
      (node, index) => {
        if (node.type === 'group') return
        const env = envelopes[node.id]
        let patch: TEnvelopeDraft = {
          id: node.id,
          group: node.group,
          parent: node.parent,
          indexRaw: index,
        }
        const needPatch =
          env.group !== patch.group ||
          env.parent !== patch.parent ||
          env.indexRaw !== patch.indexRaw
        if (needPatch) patches.push(patch)
      }
    )
    if (patches.length) dispatch(patchEnvelope(patches))
  }
