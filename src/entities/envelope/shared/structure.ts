import { ById, TEnvelopeId } from '@shared/types'
import { compareEnvelopes } from './compareEnvelopes'
import { TEnvelope } from './makeEnvelope'

export type TGroup = {
  name: string
  children: {
    id: TEnvelopeId
    children: TEnvelopeId[]
  }[]
}

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

/**
 * Builds a tree of sorted groups
 * @param envelopes
 * @returns
 */
export function buildStructure(envelopes: ById<TEnvelope>): TGroup[] {
  const groupCollection: Record<string, TGroup> = {}
  Object.values(envelopes)
    .sort(compareEnvelopes)
    .filter(e => !e.parent)
    .forEach(e => {
      groupCollection[e.group] ??= { name: e.group, children: [] }
      groupCollection[e.group].children.push({ id: e.id, children: e.children })
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
export function flattenStructure(tree: TGroup[]): TEnvelopeId[] {
  let flatList: TEnvelopeId[] = []
  tree.forEach(group => {
    group.children.forEach(({ id, children }) => {
      flatList = [...flatList, id, ...children]
    })
  })
  return flatList
}
