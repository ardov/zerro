import {
  envelopeModel,
  TEnvelopeDraft,
  TEnvelopeId,
  TEnvNode,
  TGroupNode,
} from '5-entities/envelope'
import { entries } from '6-shared/helpers/keys'
import { AppThunk } from 'store/index'
import { arrayMove } from './arrayMove'

export function moveGroup(fromIdx: number, toIdx: number): AppThunk {
  return (dispatch, getState) => {
    const structure = envelopeModel.getEnvelopeStructure(getState())
    if (fromIdx === toIdx) return
    if (!structure[fromIdx] || !structure[toIdx]) return

    const updatedStructure = [...structure]
    arrayMove(updatedStructure, fromIdx, toIdx)
    const indices = getIndices(updatedStructure)

    const patches: TEnvelopeDraft[] = entries(indices).map(
      ([id, indexRaw]) => ({ id, indexRaw })
    )

    dispatch(envelopeModel.patchEnvelope(patches))
  }
}

function getIndices(structure: TGroupNode[]) {
  let indices: Record<TEnvelopeId, number> = {}
  let idx = 0
  structure.forEach(group => group.children.forEach(addIndex))
  return indices

  function addIndex(el: TEnvNode) {
    indices[el.id] = idx
    idx++
    el.children.forEach(addIndex)
  }
}
