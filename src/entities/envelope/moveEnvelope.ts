import { TEnvelopeId } from '@shared/types'
import { AppThunk } from '@store/index'
import { getEnvelopes, getEnvelopeStructure, parseEnvelopeId } from '.'
import { patchEnvelope, TEnvelopeDraft } from './patchEnvelope'
import { flattenStructure } from './shared/structure'

export function moveEnvelope(
  id: TEnvelopeId,
  targetIdx: number,
  asChild: boolean
): AppThunk {
  return (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    const structure = getEnvelopeStructure(getState())
    const flatList = flattenStructure(structure)
    const target = flatList[targetIdx]
    const newIdx = targetIdx + 1
    const curr = flatList.find(el => el.id === id)
    const patches: TEnvelopeDraft[] = []

    if (!curr) throw new Error("Couldn't find id: " + id)

    // Group over group
    if (curr.type === 'group' && target.type === 'group') {
      // TODO
    }

    // Group over envelope
    if (curr.type === 'group' && target.type === 'envelope') {
      // TODO
    }

    // Envelope over group
    if (curr.type === 'envelope' && target.type === 'group') {
      if (asChild) throw new Error("can't insert as child into group")
      // TODO
    }

    // Envelope over envelope
    if (curr.type === 'envelope' && target.type === 'envelope') {
      const newParent = getNewParent(target.parent || target.id, asChild)
      const newGroup = target.group
      const currentEnv = envelopes[id]

      console.log('Moving envelope', currentEnv.index, '->', newIdx)

      // Change indices of affected envelopes
      const idsToMove = [currentEnv.id, ...currentEnv.children]
      idsToMove.forEach((id, idx) => {
        arrayMove(flatList, envelopes[id].index, newIdx + idx)
      })

      flatList.forEach((el, idx) => {
        if (el.type === 'group') return
        if (el.id === currentEnv.id) {
          return patches.push({
            id: el.id,
            indexRaw: idx,
            parent: newParent,
            group: newGroup,
          })
        }
        if (currentEnv.children.includes(el.id)) {
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
    console.log({ patches })

    dispatch(patchEnvelope(patches))

    function getNewParent(suppposedParent: TEnvelopeId, asChild: boolean) {
      if (!asChild) return null
      return parseEnvelopeId(suppposedParent).type === 'tag'
        ? suppposedParent
        : null
    }
  }
}

/*

 group
 - parent
 - - child 1
 - - child 2
 - - child 3
 - parent
 - - child 1
 group
 - parent
 - - child 1
 - - child 2
 - - child 3
 - parent
 - - child 1
 - - child 2
 - - child 3

*/

function arrayMove<T>(arr: Array<T>, fromIndex: number, toIndex: number) {
  var element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}
