import { AppThunk } from 'store/index'
import { envelopes as coreEnvelopes } from 'zerro-core/redux'

export function moveEnvelope(
  sourceIdx: number,
  targetIdx: number,
  asChild: boolean
): AppThunk {
  return (dispatch, getState) => {
    const structure = coreEnvelopes.selectStructure(getState())

    const newStructure = JSON.parse(
      JSON.stringify(structure)
    ) as coreEnvelopes.TGroupNode[]
    const flatList = coreEnvelopes.flattenStructure(newStructure)
    const active = flatList[sourceIdx]
    const over = flatList[targetIdx]

    if (!active) throw new Error("Couldn't find idx: " + sourceIdx)

    cutOutNode(active, newStructure)
    placeNode(active, over, asChild, newStructure)
    dispatch(
      coreEnvelopes.applyStructure(
        coreEnvelopes.toEnvelopeStructureInput(newStructure)
      )
    )
  }
}

function cutOutNode(
  node: coreEnvelopes.TEnvNode | coreEnvelopes.TGroupNode,
  structure: coreEnvelopes.TGroupNode[]
) {
  if (node.type === 'group') {
    const groupIndex = structure.indexOf(node)
    if (groupIndex !== -1) structure.splice(groupIndex, 1)
    return
  }

  const group = structure.find(group => group.id === node.group)
  if (!group) throw new Error("Couldn't find group: " + node.group)

  if (!node.parent) {
    group.children = group.children.filter(gr => gr !== node)
    return
  }

  const parent = group.children.find(parent => parent.id === node.parent)
  if (!parent) throw new Error("Couldn't find node: " + node.parent)
  parent.children = parent.children.filter(gr => gr !== node)
  return
}

function placeNode(
  node: coreEnvelopes.TEnvNode | coreEnvelopes.TGroupNode,
  under: coreEnvelopes.TEnvNode | coreEnvelopes.TGroupNode,
  asChild: boolean,
  structure: coreEnvelopes.TGroupNode[]
) {
  for (let grIdx = 0; grIdx < structure.length; grIdx++) {
    const group = structure[grIdx]
    if (group.id !== under.group) continue

    if (node.type === 'group') {
      structure.splice(grIdx + 1, 0, node)
      return
    }

    if (under.type === 'group') {
      group.children.splice(0, 0, node)
      return
    }

    const parents = group.children
    const parentId = under.parent || under.id

    for (let parentIdx = 0; parentIdx < parents.length; parentIdx++) {
      const parent = parents[parentIdx]
      if (parent.id !== parentId) continue

      if (!asChild) {
        parents.splice(parentIdx + 1, 0, node)
        return
      }

      if (!under.parent) {
        parent.children.splice(0, 0, node)
        return
      }

      const children = parent.children
      for (let childIdx = 0; childIdx < children.length; childIdx++) {
        const child = children[childIdx]
        if (child.id !== under.id) continue

        children.splice(childIdx + 1, 0, node)
        return
      }
    }
  }
}
