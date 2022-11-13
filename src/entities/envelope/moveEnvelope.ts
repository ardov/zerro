import { TEnvelopeId } from '@shared/types'
import { AppThunk } from '@store/index'
import { envId, getEnvelopes, getEnvelopeStructure } from '.'
import { patchEnvelope, TEnvelopeDraft } from './patchEnvelope'
import { flattenStructure } from './shared/structure'

export function moveEnvelope(
  sourceIdx: number,
  targetIdx: number,
  asChild: boolean
): AppThunk {
  return (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    const structure = getEnvelopeStructure(getState())
    const flatList = flattenStructure(structure)
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

    dispatch(patchEnvelope(patches))

    function getNewParent(
      elId: TEnvelopeId,
      suppposedParent: TEnvelopeId,
      asChild: boolean
    ) {
      if (!asChild) return null
      if (elId === suppposedParent) return null
      return envId.parse(suppposedParent).type === 'tag'
        ? suppposedParent
        : null
    }
  }
}

/*

 0 group
 1 - parent
 2 - - child 1
 3 - - child 2
 4 - - child 3
 5 - parent
 6 - - child 1
 7 group
 8 - parent
 9 - - child 1
10 - - child 2
11 - - child 3
12 - parent
13 - - child 1
14 - - child 2
15 - - child 3

*/

function arrayMove<T>(arr: Array<T>, fromIndex: number, toIndex: number) {
  var element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}
