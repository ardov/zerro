import { envelopeModel, TEnvelopeDraft } from '@entities/envelope'
import { TEnvelopeId } from '@shared/types'
import { AppThunk } from '@store/index'
import { arrayMove } from './arrayMove'

export function moveEnvelope(
  sourceIdx: number,
  targetIdx: number,
  asChild: boolean
): AppThunk {
  return (dispatch, getState) => {
    const envelopes = envelopeModel.getEnvelopes(getState())
    const structure = envelopeModel.getEnvelopeStructure(getState())
    const flatList = envelopeModel.flattenStructure(structure)
    const active = flatList[sourceIdx]
    const over = flatList[targetIdx]
    const patches: TEnvelopeDraft[] = []

    if (!active) throw new Error("Couldn't find idx: " + sourceIdx)

    // Group over group
    if (active.type === 'group' && over.type === 'group') {
      // TODO
    }

    // Group over envelope
    if (active.type === 'group' && over.type === 'envelope') {
      // TODO
    }

    // Envelope over group
    if (active.type === 'envelope' && over.type === 'group') {
      if (asChild) throw new Error("can't insert as child into group")
      // TODO
    }

    // Envelope over envelope
    if (active.type === 'envelope' && over.type === 'envelope') {
      const newParent = getNewParent(active.id, over.parent || over.id, asChild)
      const newGroup = over.group
      const activeEnv = envelopes[active.id]
      const newActiveIdx = sourceIdx > targetIdx ? targetIdx + 1 : targetIdx

      console.log('Moving envelope', sourceIdx, '->', newActiveIdx)

      // Change indices of affected envelopes
      const idsToMove = [activeEnv.id, ...activeEnv.children]
      idsToMove.forEach((id, idx) => {
        arrayMove(flatList, envelopes[id].index, newActiveIdx + idx)
      })

      flatList.forEach((el, idx) => {
        if (el.type === 'group') return
        if (el.id === activeEnv.id) {
          return patches.push({
            id: el.id,
            indexRaw: idx,
            parent: newParent,
            group: newGroup,
          })
        }
        if (activeEnv.children.includes(el.id)) {
          if (newParent) {
            return patches.push({
              id: el.id,
              indexRaw: idx,
              parent: newParent,
              group: newGroup,
            })
          }
          return patches.push({ id: el.id, indexRaw: idx, group: newGroup })
        }
        patches.push({ id: el.id, indexRaw: idx })
      })
    }

    dispatch(envelopeModel.patchEnvelope(patches))

    function getNewParent(
      elId: TEnvelopeId,
      suppposedParent: TEnvelopeId,
      asChild: boolean
    ) {
      if (!asChild) return null
      if (elId === suppposedParent) return null
      return envelopeModel.parseId(suppposedParent).type === 'tag'
        ? suppposedParent
        : null
    }
  }
}
