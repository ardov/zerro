import { envelopeModel, TEnvelopeDraft, TEnvTreeNode } from '@entities/envelope'
import { keys } from '@shared/helpers/keys'
import { TEnvelopeId } from '@shared/types'
import { AppThunk } from '@store/index'

export function moveGroupDown(groupName: string): AppThunk {
  return (dispatch, getState) => {
    const envelopes = envelopeModel.getEnvelopes(getState())
    const structure = envelopeModel.getEnvelopeStructure(getState())

    let indices: Record<TEnvelopeId, number> = {}
    Object.values(envelopes).forEach(e => {
      indices[e.id] = e.index
    })

    const currIdx = structure.findIndex(el => el.id === groupName)
    const currentGroup = structure[currIdx]
    const nextGroup = structure[currIdx + 1]
    if (!currentGroup || !nextGroup) return

    const firstEnv = currentGroup.children[0].id
    let idx = envelopes[firstEnv].index

    function updateIdx(el: TEnvTreeNode) {
      indices[el.id] = idx
      idx++
      el.children.forEach(updateIdx)
    }

    nextGroup.children.forEach(updateIdx)
    currentGroup.children.forEach(updateIdx)

    const patches: TEnvelopeDraft[] = []
    keys(indices).forEach(id => patches.push({ id, indexRaw: indices[id] }))
    dispatch(envelopeModel.patchEnvelope(patches))
  }
}
