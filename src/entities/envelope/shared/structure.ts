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
  return getRightParent(parent.parent, byId)
}

type TEnvNode = { id: TEnvelopeId; type: 'envelope' }
type TGroupNode = { id: string; type: 'group' }
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
    .forEach(e => {
      groupCollection[e.group] ??= { id: e.group, type: 'group', children: [] }
      const children: TEnvTreeNode[] = e.children.map(id => {
        return { id, type: 'envelope', children: [] }
      })
      groupCollection[e.group].children.push({
        id: e.id,
        type: 'envelope',
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
    flatList.push({ id: node.id, type: node.type } as TEnvNode | TGroupNode)
    node.children.forEach(addNode)
  }
}
