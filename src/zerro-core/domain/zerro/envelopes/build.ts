import type { ById } from '../../shared/types'
import type { TAccount } from '../../zenmoney/accounts'
import type { TFxCode } from '../../zenmoney/instruments'
import { int2hex } from '../../zenmoney/colors'
import type { TTag, TTagId } from '../../zenmoney/tags'
import { keys } from '../../shared/keys'
import type { TDebtor } from '../../zenmoney'
import { EnvType, envId, TEnvelopeId } from '../envelope-id'
import { envelopeVisibility, TEnvelopeMeta } from '../envelope-meta'

export const defaultEnvelopeGroupIds = {
  tags: 'default:tags',
  accounts: 'default:accounts',
  merchants: 'default:merchants',
  payees: 'default:payees',
} as const

export type TDefaultEnvelopeGroupId =
  (typeof defaultEnvelopeGroupIds)[keyof typeof defaultEnvelopeGroupIds]

export type TEnvelopeTag = Pick<
  TTag,
  'id' | 'title' | 'parent' | 'showOutcome' | 'color'
>

const uncategorizedTagId = 'null' as TTagId
export const uncategorizedEnvelopeName = 'No category'

const uncategorizedEnvelopeTag: TEnvelopeTag = {
  id: uncategorizedTagId,
  title: uncategorizedEnvelopeName,
  color: null,
  showOutcome: false,
  parent: null,
}

export type TEnvelopeDebtor = TDebtor

export type TEnvelope = {
  id: TEnvelopeId
  type: EnvType
  entityId: string
  name: string
  originalName: string
  colorHex: string | null
  children: TEnvelopeId[]
  parent: TEnvelopeId | null
  index: number
  indexRaw: number | undefined
  visibility: envelopeVisibility
  group: string
  comment: string
  currency: TFxCode
  keepIncome: boolean
  carryNegatives: boolean
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

export type TBuildEnvelopesInput = {
  debtors: ById<TEnvelopeDebtor>
  tags: ById<TEnvelopeTag>
  savingAccounts: TAccount[]
  envelopeMeta: ById<TEnvelopeMeta>
  userCurrency: TFxCode
}

export function buildEnvelopes(input: TBuildEnvelopesInput): {
  byId: ById<TEnvelope>
  structure: TGroupNode[]
} {
  const envelopes: ById<TEnvelope> = {}
  const tags = getEnvelopeTags(input.tags)

  Object.values(tags).forEach(tag => {
    const envelope = makeEnvelopeFromTag(
      tag,
      input.envelopeMeta,
      input.userCurrency
    )
    envelopes[envelope.id] = envelope
  })
  input.savingAccounts.forEach(account => {
    const envelope = makeEnvelopeFromAccount(
      account,
      input.envelopeMeta,
      input.userCurrency
    )
    envelopes[envelope.id] = envelope
  })
  Object.values(input.debtors).forEach(debtor => {
    const envelope = makeEnvelopeFromDebtor(
      debtor,
      input.envelopeMeta,
      input.userCurrency
    )
    envelopes[envelope.id] = envelope
  })

  const structure = buildStructure(envelopes)

  flattenStructure(structure).forEach((node, index) => {
    if (node.type === 'group') return
    const envelope = envelopes[node.id]
    envelope.parent = node.parent
    envelope.group = node.group
    envelope.children = node.children.map(child => child.id)
    envelope.index = index
  })

  return { byId: envelopes, structure }
}

export function getKeepingEnvelopes(envelopes: ById<TEnvelope>): TEnvelopeId[] {
  return keys(envelopes).filter(id => envelopes[id].keepIncome)
}

function getEnvelopeTags(tags: ById<TEnvelopeTag>): ById<TEnvelopeTag> {
  return {
    [uncategorizedTagId]: uncategorizedEnvelopeTag,
    ...tags,
  }
}

function makeEnvelopeFromTag(
  tag: TEnvelopeTag,
  metaById: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = envId.get(EnvType.Tag, tag.id)
  const meta = metaById[id]

  return {
    id,
    type: EnvType.Tag,
    entityId: tag.id,
    name: tag.title,
    originalName: tag.title,
    colorHex: int2hex(tag.color),
    visibility: getVisibility(meta?.visibility, tag.showOutcome),
    parent: tag.parent ? envId.get(EnvType.Tag, tag.parent) : null,
    children: [],
    index: meta?.index || -1,
    indexRaw: meta?.index,
    group: meta?.group || defaultEnvelopeGroupIds.tags,
    comment: meta?.comment || '',
    currency: meta?.currency || userCurrency,
    keepIncome: meta?.keepIncome || false,
    carryNegatives: meta?.carryNegatives || false,
  }
}

function makeEnvelopeFromAccount(
  account: TAccount,
  metaById: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = envId.get(EnvType.Account, account.id)
  const meta = metaById[id]

  return {
    id,
    type: EnvType.Account,
    entityId: account.id,
    name: account.title,
    originalName: account.title,
    colorHex: null,
    visibility: getVisibility(meta?.visibility),
    parent: meta?.parent || null,
    children: [],
    index: meta?.index || -1,
    indexRaw: meta?.index,
    group: meta?.group || defaultEnvelopeGroupIds.accounts,
    comment: meta?.comment || '',
    currency: meta?.currency || userCurrency,
    keepIncome: meta?.keepIncome || false,
    carryNegatives: meta?.carryNegatives || false,
  }
}

function makeEnvelopeFromDebtor(
  debtor: TEnvelopeDebtor,
  metaById: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = debtor.merchantId
    ? envId.get(EnvType.Merchant, debtor.merchantId)
    : envId.get(EnvType.Payee, debtor.id)
  const meta = metaById[id]

  return {
    id,
    type: debtor.merchantId ? EnvType.Merchant : EnvType.Payee,
    entityId: debtor.merchantId || debtor.id,
    name: debtor.name,
    originalName: debtor.name,
    colorHex: null,
    visibility: getVisibility(meta?.visibility),
    parent: meta?.parent || null,
    children: [],
    index: meta?.index || -1,
    indexRaw: meta?.index,
    group:
      meta?.group ||
      (debtor.merchantId
        ? defaultEnvelopeGroupIds.merchants
        : defaultEnvelopeGroupIds.payees),
    comment: meta?.comment || '',
    currency: meta?.currency || userCurrency,
    keepIncome: meta?.keepIncome || false,
    carryNegatives: meta?.carryNegatives || false,
  }
}

function getVisibility(
  isVisible: envelopeVisibility | undefined,
  tagShowOutcome?: boolean
): envelopeVisibility {
  if (isVisible) return isVisible
  if (tagShowOutcome) return envelopeVisibility.visible
  return envelopeVisibility.auto
}

export function buildStructure(envelopes: ById<TEnvelope>): TGroupNode[] {
  const groups: TGroupNode[] = []
  const groupsById: Record<string, TGroupNode> = {}
  const sortedParents: TEnvNode[] = []
  const sortedChildren: TEnvNode[] = []
  const nodesById: Record<TEnvelopeId, TEnvNode> = {}

  Object.values(envelopes)
    .sort(compareEnvelopes)
    .forEach(envelope => {
      const parent = getRightParent(envelope.parent, envelopes)
      const group = parent ? envelopes[parent].group : envelope.group
      const node: TEnvNode = {
        id: envelope.id,
        type: 'envelope',
        group,
        parent,
        children: [],
      }
      nodesById[node.id] = node

      if (parent) sortedChildren.push(node)
      else sortedParents.push(node)
    })

  sortedChildren.forEach(child => {
    if (!child.parent) return
    nodesById[child.parent].children.push(child)
  })

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
      groups.push(group)
    }

    groupsById[parent.group].children.push(parent)
  })

  return groups
}

function getRightParent(
  parentId: TEnvelope['parent'] | undefined,
  byId: ById<TEnvelope>
): TEnvelope['parent'] {
  if (!parentId) return null
  const parent = byId[parentId]
  if (!parent) return null
  if (!parent.parent) return parentId
  if (parent.parent === parentId) return null
  return getRightParent(parent.parent, byId)
}

export function flattenStructure(tree: TGroupNode[]) {
  const flatList: (TEnvNode | TGroupNode)[] = []
  tree.forEach(addNode)
  return flatList

  function addNode(node: TEnvNode | TGroupNode) {
    flatList.push(node)
    node.children.forEach(addNode)
  }
}

function compareEnvelopes(a: TEnvelope, b: TEnvelope) {
  if (a.indexRaw !== undefined && b.indexRaw !== undefined) {
    return a.indexRaw - b.indexRaw
  }
  if (a.indexRaw !== undefined) return -1
  if (b.indexRaw !== undefined) return 1

  if (a.type !== b.type) {
    const typeOrder = [
      EnvType.Tag,
      EnvType.Account,
      EnvType.Merchant,
      EnvType.Payee,
    ]
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  }

  const nullTagId = envId.get(EnvType.Tag, null)
  if (a.id === nullTagId) return -1
  if (b.id === nullTagId) return 1

  return a.name.localeCompare(b.name)
}
