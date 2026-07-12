import { hex2int, isHEX } from '../../zenmoney/colors'
import type { ById, OptionalExceptFor } from '../../shared/types'
import type { TFxCode } from '../../zenmoney/instruments'
import type { TDataStore } from '../../zenmoney/store'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../../../types'
import {
  compileCreateTag,
  compilePatchAccount,
  compilePatchMerchant,
  compilePatchTag,
  type TAccountPatch,
  type TMerchantPatch,
  type TTagId,
  type TTagPatch,
} from '../../zenmoney'
import { EnvType, envId, type TEnvelopeId } from '../envelope-id'
import {
  compilePatchEnvelopeMeta,
  envelopeVisibility,
  getEnvelopeMeta,
  type TEnvelopeMetaPatch,
} from '../envelope-meta'
import { mergeNormalizedPatches } from '../hidden-data'
import type { TEnvelope, TEnvNode, TGroupNode } from './build'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

export type TRenameEnvelopeInput = {
  id: TEnvelopeId
  name: string
}

export type TSetEnvelopeColorInput = {
  id: TEnvelopeId
  colorHex: string | null
}

export type TSetEnvelopeCommentInput = {
  id: TEnvelopeId
  comment: string
}

export type TUpdateEnvelopeSettingsInput = {
  id: TEnvelopeId
  name: string
  colorHex: string | null
  currency: TFxCode
  visibility: envelopeVisibility
  keepIncome: boolean
}

export type TCreateEnvelopeInput = {
  name: string
  group?: string
  index?: number
  comment?: string
}

export type TCreateEnvelopeReceipt = {
  envelopeId: TEnvelopeId
}

export type TEnvelopeStructureNodeInput = {
  id: TEnvelopeId
  children?: TEnvelopeStructureNodeInput[]
}

export type TEnvelopeStructureGroupInput = {
  group: string
  children: TEnvelopeStructureNodeInput[]
}

export type TApplyEnvelopeStructureInput = TEnvelopeStructureGroupInput[]

type TEnvelopePatches = {
  tag: TTagPatch[]
  account: TAccountPatch[]
  merchant: TMerchantPatch[]
  meta: TEnvelopeMetaPatch[]
}

type TEnvelopePatch = {
  tag?: TTagPatch
  account?: TAccountPatch
  merchant?: TMerchantPatch
  meta?: TEnvelopeMetaPatch
}

export function compileCreateEnvelope(
  data: TDataStore,
  input: TCreateEnvelopeInput,
  ctx: TCoreContext
): TCompiled<TCreateEnvelopeReceipt> {
  const tagPatch = compileCreateTag(
    data,
    { title: input.name, showOutcome: true },
    ctx
  )
  const tag = tagPatch.tag?.[0]
  if (!tag) throw new Error('Envelope tag was not created')

  const envelopeId = envId.get(EnvType.Tag, tag.id)
  const metadata: TEnvelopeMetaPatch = { id: envelopeId }
  if (input.group !== undefined) metadata.group = input.group
  if (input.index !== undefined) metadata.index = input.index
  if (input.comment !== undefined) metadata.comment = input.comment

  const metadataPatch =
    Object.keys(metadata).length > 1
      ? compilePatchEnvelopeMeta(data, metadata, ctx)
      : {}

  return {
    patch: mergeNormalizedPatches(tagPatch, metadataPatch),
    receipt: { envelopeId },
  }
}

/**
 * Converts a projected structure tree into the minimal semantic structure
 * input, keeping group, nesting, and index order.
 */
export function toEnvelopeStructureInput(
  structure: TGroupNode[]
): TApplyEnvelopeStructureInput {
  return structure.map(group => ({
    group: group.id,
    children: group.children.map(toStructureNodeInput),
  }))
}

function toStructureNodeInput(node: TEnvNode): TEnvelopeStructureNodeInput {
  return { id: node.id, children: node.children.map(toStructureNodeInput) }
}

/**
 * Compiles the full desired envelope hierarchy into one atomic patch. The
 * input is the complete ordered structure; envelopes absent from it stay
 * untouched. Normalization mirrors the projector: empty groups are dropped,
 * same-named groups merge, deep nesting flattens to two levels, and tags
 * nested under non-tag parents are elevated to the group level.
 */
export function compileApplyEnvelopeStructure(
  data: TDataStore,
  envelopes: ById<TEnvelope>,
  input: TApplyEnvelopeStructureInput,
  ctx: TCoreContext
): TNormalizedPatch {
  const drafts: TEnvelopeDraft[] = []
  // Index counts every flattened node, group nodes included, matching the
  // index order the structure projector assigns after `flattenStructure`.
  let index = 0

  mergeStructureGroups(input).forEach(group => {
    if (!group.children.length) return
    index++
    normalizeStructureGroup(group.children).forEach(node => {
      if (!envelopes[node.id]) throw new Error('Envelope not found')
      drafts.push({
        id: node.id,
        group: group.group,
        parent: node.parent,
        indexRaw: index++,
      })
    })
  })

  return compilePatchEnvelope(data, envelopes, drafts, ctx)
}

function mergeStructureGroups(
  input: TApplyEnvelopeStructureInput
): TApplyEnvelopeStructureInput {
  const byName = new Map<string, TEnvelopeStructureGroupInput>()
  input.forEach(group => {
    const existing = byName.get(group.group)
    if (existing) existing.children = existing.children.concat(group.children)
    else byName.set(group.group, { ...group, children: [...group.children] })
  })
  return [...byName.values()]
}

type TFlatStructureNode = {
  id: TEnvelopeId
  parent: TEnvelopeId | null
}

function normalizeStructureGroup(
  children: TEnvelopeStructureNodeInput[]
): TFlatStructureNode[] {
  const result: TFlatStructureNode[] = []

  children.forEach(node => {
    const parentIsTag = envId.parse(node.id).type === EnvType.Tag
    const nested: TFlatStructureNode[] = []
    const elevated: TFlatStructureNode[] = []

    flattenStructureDescendants(node.children || []).forEach(id => {
      const childIsTag = envId.parse(id).type === EnvType.Tag
      if (!parentIsTag && childIsTag) {
        // Impossible to nest a tag under a virtual envelope => elevate
        elevated.push({ id, parent: null })
      } else {
        nested.push({ id, parent: node.id })
      }
    })

    result.push({ id: node.id, parent: null }, ...nested, ...elevated)
  })

  return result
}

function flattenStructureDescendants(
  nodes: TEnvelopeStructureNodeInput[]
): TEnvelopeId[] {
  const flat: TEnvelopeId[] = []
  nodes.forEach(function visit(node) {
    ;(node.children || []).forEach(visit)
    flat.push(node.id)
  })
  return flat
}

export function compileRenameEnvelope(
  data: TDataStore,
  input: TRenameEnvelopeInput,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const { type, id } = envId.parse(input.id)

  switch (type) {
    case EnvType.Tag:
      if (data.tag[id]?.title === input.name) return {}
      return compilePatchTag(data, { id, title: input.name }, ctx)
    case EnvType.Account:
      if (data.account[id]?.title === input.name) return {}
      return compilePatchAccount(data, { id, title: input.name }, ctx)
    case EnvType.Merchant:
      if (data.merchant[id]?.title === input.name) return {}
      return compilePatchMerchant(data, { id, title: input.name }, ctx)
    case EnvType.Payee:
      // TODO: Resolve the payee envelope to all debtor.payeeNames variants and
      // patch `transaction.payee` for every matching transaction. Merchant
      // envelopes already rename their normalized merchant entity above.
      throw new Error('Payee envelopes cannot be renamed')
  }
}

export function compileSetEnvelopeColor(
  data: TDataStore,
  input: TSetEnvelopeColorInput,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const { type, id } = envId.parse(input.id)
  if (type !== EnvType.Tag) {
    throw new Error('Only tag envelopes have configurable colors')
  }
  if (id === 'null') {
    throw new Error('Uncategorized envelope color cannot be changed')
  }
  if (input.colorHex !== null && !isHEX(input.colorHex)) {
    throw new Error('Invalid envelope color')
  }

  const color = hex2int(input.colorHex)
  if (data.tag[id]?.color === color) return {}
  return compilePatchTag(data, { id, color }, ctx)
}

export function compileSetEnvelopeComment(
  data: TDataStore,
  input: TSetEnvelopeCommentInput,
  ctx: TCoreContext
): TNormalizedPatch {
  const currentComment = getEnvelopeMeta(data)[input.id]?.comment || ''
  if (currentComment === input.comment) return {}

  return compilePatchEnvelopeMeta(data, input, ctx)
}

export function compileUpdateEnvelopeSettings(
  data: TDataStore,
  envelopes: ById<TEnvelope>,
  input: TUpdateEnvelopeSettingsInput,
  ctx: TCoreContext
): TNormalizedPatch {
  const current = envelopes[input.id]
  if (!current) throw new Error('Envelope not found')

  const { type, id } = envId.parse(input.id)
  if (type === EnvType.Payee && current.originalName !== input.name) {
    throw new Error('Payee envelopes cannot be renamed')
  }
  if (current.colorHex !== input.colorHex) {
    if (type !== EnvType.Tag) {
      throw new Error('Only tag envelopes have configurable colors')
    }
    if (id === 'null') {
      throw new Error('Uncategorized envelope color cannot be changed')
    }
    if (input.colorHex !== null && !isHEX(input.colorHex)) {
      throw new Error('Invalid envelope color')
    }
  }

  return compilePatchEnvelope(
    data,
    envelopes,
    {
      id: input.id,
      originalName: input.name,
      colorHex: input.colorHex,
      currency: input.currency,
      visibility: input.visibility,
      keepIncome: input.keepIncome,
    },
    ctx
  )
}

export function compilePatchEnvelope(
  data: TDataStore,
  envelopes: ById<TEnvelope>,
  draft: TEnvelopeDraft | TEnvelopeDraft[],
  ctx: TCoreContext
): TNormalizedPatch {
  const patches = getEnvelopePatches(draft, envelopes)

  return mergeNormalizedPatches(
    patches.tag.length ? compilePatchTag(data, patches.tag, ctx) : {},
    patches.account.length
      ? compilePatchAccount(data, patches.account, ctx)
      : {},
    patches.merchant.length
      ? compilePatchMerchant(data, patches.merchant, ctx)
      : {},
    patches.meta.length ? compilePatchEnvelopeMeta(data, patches.meta, ctx) : {}
  )
}

export function compilePatchEnvelopeMetadata(
  data: TDataStore,
  envelopes: ById<TEnvelope>,
  draft: TEnvelopeDraft | TEnvelopeDraft[],
  ctx: TCoreContext
): TNormalizedPatch {
  const metaPatches = toArray(draft)
    .map(item => getEnvelopePatch(item, envelopes).meta)
    .filter((patch): patch is TEnvelopeMetaPatch => !!patch)

  if (!metaPatches.length) return {}
  return compilePatchEnvelopeMeta(data, metaPatches, ctx)
}

function getEnvelopePatches(
  draft: TEnvelopeDraft | TEnvelopeDraft[],
  envelopes: ById<TEnvelope>
): TEnvelopePatches {
  const patches: TEnvelopePatches = {
    tag: [],
    account: [],
    merchant: [],
    meta: [],
  }

  toArray(draft).forEach(item => {
    const patch = getEnvelopePatch(item, envelopes)
    if (patch.tag) patches.tag.push(patch.tag)
    if (patch.account) patches.account.push(patch.account)
    if (patch.merchant) patches.merchant.push(patch.merchant)
    if (patch.meta) patches.meta.push(patch.meta)
  })

  return patches
}

function getEnvelopePatch(
  draft: TEnvelopeDraft,
  envelopes: ById<TEnvelope>
): TEnvelopePatch {
  const current = envelopes[draft.id]
  if (!current) throw new Error('Envelope not found')

  const { type, id } = envId.parse(draft.id)
  const patch: TEnvelopePatch = {}

  Object.entries(draft).forEach(([key, value]) => {
    const draftKey = key as keyof TEnvelopeDraft
    if (current[draftKey] === value) return

    switch (draftKey) {
      case 'originalName':
        if (type === EnvType.Tag) {
          patch.tag ??= { id }
          patch.tag.title = value as TEnvelope['originalName']
        } else if (type === EnvType.Account) {
          patch.account ??= { id }
          patch.account.title = value as TEnvelope['originalName']
        } else if (type === EnvType.Merchant) {
          patch.merchant ??= { id }
          patch.merchant.title = value as TEnvelope['originalName']
        }
        break

      case 'colorHex':
        if (type === EnvType.Tag) {
          patch.tag ??= { id }
          patch.tag.color = getTagColor(value as TEnvelope['colorHex'])
        }
        break

      case 'indexRaw':
        patch.meta ??= { id: draft.id }
        patch.meta.index = value as TEnvelope['indexRaw']
        break

      case 'parent':
        if (type === EnvType.Tag) {
          patch.tag ??= { id }
          patch.tag.parent = getRightTagParent(
            value as TEnvelope['parent'],
            envelopes
          )
        } else {
          patch.meta ??= { id: draft.id }
          patch.meta.parent =
            getRightParent(value as TEnvelope['parent'], envelopes) || undefined
        }
        break

      case 'visibility':
      case 'group':
      case 'comment':
      case 'currency':
      case 'keepIncome':
      case 'carryNegatives':
        patch.meta ??= { id: draft.id }
        patch.meta[draftKey] = value as never
        break
    }
  })

  return patch
}

function getRightParent(
  parentId: TEnvelope['parent'] | undefined,
  envelopes: ById<TEnvelope>
): TEnvelope['parent'] {
  if (!parentId) return null
  const parent = envelopes[parentId]
  if (!parent) return null
  if (!parent.parent) return parentId
  if (parent.parent === parentId) return null
  return getRightParent(parent.parent, envelopes)
}

function getRightTagParent(
  parent: TEnvelopeId | null | undefined,
  envelopes: ById<TEnvelope>
): TTagId | null {
  const id = getRightParent(parent, envelopes)
  if (!id) return null
  const parsed = envId.parse(id)
  if (parsed.type !== EnvType.Tag) throw new Error('Parent is not tag')
  if (parsed.id === 'null') return null
  return parsed.id
}

function getTagColor(color?: string | null) {
  if (isHEX(color)) return hex2int(color)
  return null
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
