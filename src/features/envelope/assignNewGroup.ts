import {
  envelopeModel,
  TEnvelopeDraft,
  TEnvelopeId,
  TGroupNode,
} from '@entities/envelope'
import { AppThunk } from '@store/index'

export function assignNewGroup(id: TEnvelopeId): AppThunk {
  return (dispatch, getState) => {
    const envelopes = envelopeModel.getEnvelopes(getState())
    const structure = envelopeModel.getEnvelopeStructure(getState())
    const groupName = getNewGroupName(structure)

    const patches: TEnvelopeDraft[] = Object.values(envelopes).map(e => {
      if (e.id === id) {
        return { id, group: groupName, indexRaw: 0 }
      }
      return { id: e.id, indexRaw: e.index + 1 }
    })

    dispatch(envelopeModel.patchEnvelope(patches))
  }
}

function getNewGroupName(structure: TGroupNode[]) {
  const baseName = 'Новая группа'
  let names = structure
    .map(group => group.id)
    .filter(name => name.startsWith(baseName))
  if (names.length === 0) return baseName

  let i = 2
  while (names.indexOf(`${baseName} ${i}`) >= 0) {
    i++
  }
  return `${baseName} ${i}`
}
