import type { ById } from '../../shared/types'
import { getColorForString } from '../../zenmoney/colors'
import {
  buildStructure,
  defaultEnvelopeGroupIds,
  flattenStructure,
  type TEnvelope,
  type TGroupNode,
} from '../../zerro/envelopes'
import { EnvType } from '../../zerro/envelope-id'
import type { TTagPopulated } from './tagPresentation'

export type TEnvelopeLabels = {
  defaultTagGroup: string
  defaultAccountGroup: string
  defaultMerchantGroup: string
  defaultPayeeGroup: string
}

export type TPresentedEnvelope = TEnvelope & {
  symbol: string
  colorGenerated: string
  colorDisplay: string
}

export function presentEnvelopes(
  envelopes: ById<TEnvelope>,
  tags: ById<TTagPopulated>,
  labels: TEnvelopeLabels
): { byId: ById<TPresentedEnvelope>; structure: TGroupNode[] } {
  const byId = Object.fromEntries(
    Object.entries(envelopes).map(([id, envelope]) => [
      id,
      presentEnvelope(envelope, tags, labels),
    ])
  )
  const structure = buildStructure(byId)

  flattenStructure(structure).forEach((node, index) => {
    if (node.type === 'group') return
    const envelope = byId[node.id]
    envelope.parent = node.parent
    envelope.group = node.group
    envelope.children = node.children.map(child => child.id)
    envelope.index = index
  })

  return { byId, structure }
}

function presentEnvelope(
  envelope: TEnvelope,
  tags: ById<TTagPopulated>,
  labels: TEnvelopeLabels
): TPresentedEnvelope {
  if (envelope.type === EnvType.Tag) {
    const tag = tags[envelope.entityId]
    const colorGenerated =
      tag?.colorGenerated || getColorForString(envelope.originalName)

    return {
      ...envelope,
      name: tag?.name || envelope.name,
      originalName: tag?.title || envelope.originalName,
      symbol: tag?.symbol || '?',
      colorHex: envelope.entityId === 'null' ? '#ff0000' : envelope.colorHex,
      colorGenerated,
      colorDisplay:
        envelope.entityId === 'null'
          ? '#ff0000'
          : tag?.colorDisplay || envelope.colorHex || colorGenerated,
      group: localizeGroup(envelope.group, labels),
    }
  }

  const colorGenerated = getColorForString(envelope.originalName)
  return {
    ...envelope,
    symbol: envelope.type === EnvType.Account ? '🏦' : '👤',
    colorGenerated,
    colorDisplay: colorGenerated,
    group: localizeGroup(envelope.group, labels),
  }
}

function localizeGroup(group: string, labels: TEnvelopeLabels): string {
  switch (group) {
    case defaultEnvelopeGroupIds.tags:
      return labels.defaultTagGroup
    case defaultEnvelopeGroupIds.accounts:
      return labels.defaultAccountGroup
    case defaultEnvelopeGroupIds.merchants:
      return labels.defaultMerchantGroup
    case defaultEnvelopeGroupIds.payees:
      return labels.defaultPayeeGroup
    default:
      return group
  }
}

export function getDomainEnvelopeGroup(
  group: string,
  labels: TEnvelopeLabels
): string {
  switch (group) {
    case labels.defaultTagGroup:
      return defaultEnvelopeGroupIds.tags
    case labels.defaultAccountGroup:
      return defaultEnvelopeGroupIds.accounts
    case labels.defaultMerchantGroup:
      return defaultEnvelopeGroupIds.merchants
    case labels.defaultPayeeGroup:
      return defaultEnvelopeGroupIds.payees
    default:
      return group
  }
}
