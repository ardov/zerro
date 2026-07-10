import { hex2int, isHEX } from '../../zenmoney/colors'
import type { ById, OptionalExceptFor } from '../../shared/types'
import type { TDataStore } from '../../zenmoney/store'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import {
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
  type TEnvelopeMetaPatch,
} from '../envelope-meta'
import { mergeNormalizedPatches } from '../hidden-data'
import type { TEnvelope } from './build'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

export type TRenameEnvelopeInput = {
  id: TEnvelopeId
  name: string
}

export type TSetEnvelopeColorInput = {
  id: TEnvelopeId
  colorHex: string | null
}

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
