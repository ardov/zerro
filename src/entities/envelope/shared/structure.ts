import { ById } from '@shared/types'
import { compareEnvelopes } from './compareEnvelopes'
import { TEnvelopeId } from './envelopeId'
import { TEnvelope } from './makeEnvelope'

/**
 * Returns id of the topmost parent. So it flattens envelopes to only 2 levels of depth
 * @param parentId
 * @param byId
 * @returns
 */
export function getRightParent(
  parentId: TEnvelope['parent'] | undefined,
  byId: ById<TEnvelope>
): TEnvelope['parent'] {
  if (!parentId) return null
  const parent = byId[parentId]
  if (!parent) return null
  if (!parent.parent) return parentId
  if (parent.parent === parentId) return null // prevent cycles
  return getRightParent(parent.parent, byId)
}

export type TEnvNode = {
  type: 'envelope'
  id: TEnvelopeId
  group: string
  parent: TEnvelopeId | null
  children: TEnvNode[]
}
export type TGroupNode = {
  type: 'group'
  id: string
  group: string
  parent: null
  children: TEnvNode[]
}

/**
 * Builds a tree of sorted groups
 * It's a main place for applying sorting and fixing nesting issues
 * @param envelopes
 * @returns
 */
export function buildStructure(envelopes: ById<TEnvelope>): TGroupNode[] {
  const groups: TGroupNode[] = []
  const groupsById: Record<string, TGroupNode> = {}

  const sortedParents = [] as TEnvNode[]
  const sortedChildren = [] as TEnvNode[]
  const nodesById: Record<TEnvelopeId, TEnvNode> = {}

  Object.values(envelopes)
    .sort(compareEnvelopes)
    .forEach(env => {
      const parent = getRightParent(env.parent, envelopes)
      const group = parent ? envelopes[parent].group : env.group
      const node: TEnvNode = {
        id: env.id,
        type: 'envelope',
        group,
        parent,
        children: [],
      }
      nodesById[node.id] = node
      if (parent) sortedChildren.push(node)
      else sortedParents.push(node)
    })

  // Attach children
  sortedChildren.forEach(child => {
    if (!child.parent) return console.error('Child without parent')
    nodesById[child.parent].children.push(child)
  })

  // Create groups and attach parents to them
  sortedParents.forEach(parent => {
    if (!groupsById[parent.group]) {
      const group: TGroupNode = {
        id: parent.group,
        type: 'group',
        group: parent.group,
        parent: null,
        children: [],
      }
      groupsById[group.id] = group
      // Groups will be sorted by first parent
      groups.push(group)
    }
    groupsById[parent.group].children.push(parent)
  })

  return groups
}

/**
 * Flattens structure to an id array
 * @param tree
 * @returns sorted list of tree nodes
 */
export function flattenStructure(tree: TGroupNode[]) {
  let flatList: (TEnvNode | TGroupNode)[] = []
  tree.forEach(addNode)
  return flatList

  function addNode(node: TEnvNode | TGroupNode) {
    flatList.push(node)
    node.children.forEach(addNode)
  }
}
