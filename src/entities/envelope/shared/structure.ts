import { ById, TEnvelopeId } from '@shared/types'
import { compareEnvelopes } from './compareEnvelopes'
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

type TEnvNode = {
  type: 'envelope'
  id: TEnvelopeId
  group: string
  parent: TEnvelopeId | null
}
type TGroupNode = {
  type: 'group'
  id: string
  group: string
  parent: null
}
type TEnvTreeNode = TEnvNode & { children: TEnvTreeNode[] }
type TGroupTreeNode = TGroupNode & { children: TEnvTreeNode[] }

/**
 * Builds a tree of sorted groups
 * @param envelopes
 * @returns
 */
export function buildStructure(envelopes: ById<TEnvelope>): TGroupTreeNode[] {
  const groupCollection: Record<string, TGroupTreeNode> = {}
  Object.values(envelopes)
    .sort(compareEnvelopes)
    .filter(e => !e.parent)
    .forEach(parent => {
      // Create group
      groupCollection[parent.group] ??= {
        id: parent.group,
        type: 'group',
        group: parent.group,
        parent: null,
        children: [],
      }
      // Create children nodes
      const children: TEnvTreeNode[] = parent.children.map(id => {
        return {
          id,
          type: 'envelope',
          group: parent.group,
          parent: parent.id,
          children: [],
        }
      })
      // Push node with children into group
      groupCollection[parent.group].children.push({
        id: parent.id,
        type: 'envelope',
        group: parent.group,
        parent: parent.parent,
        children,
      })
    })
  const groupList = Object.values(groupCollection).sort((a, b) => {
    let envA = envelopes[a.children[0].id]
    let envB = envelopes[b.children[0].id]
    return compareEnvelopes(envA, envB)
  })

  return groupList
}

/**
 * Flattens structure to an id array
 * @param tree
 * @returns list of envelope ids
 */
export function flattenStructure(
  tree: TGroupTreeNode[]
): (TEnvNode | TGroupNode)[] {
  let flatList: (TEnvNode | TGroupNode)[] = []
  tree.forEach(addNode)
  return flatList

  function addNode(node: TEnvTreeNode | TGroupTreeNode) {
    flatList.push({
      id: node.id,
      type: node.type,
      group: node.group,
      parent: node.parent,
    } as TEnvNode | TGroupNode)
    node.children.forEach(addNode)
  }
}
