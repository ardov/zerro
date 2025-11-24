import type { TTagDraft } from '5-entities/tag'
import type { AppThunk } from 'store'
import { ById, DataEntity, OptionalExceptFor, TTagId } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { envId, EnvType, TEnvelopeId } from './shared/envelopeId'
import { hex2int, isHEX } from '6-shared/helpers/color'
import { accountModel, TAccountPatch } from '5-entities/account'
import { TMerchantPatch, merchantModel } from '5-entities/merchant'
import { tagModel } from '5-entities/tag'
import { patchEnvelopeMeta, TEnvelopeMetaPatch } from './shared/metaData'
import { TEnvelope } from './shared/makeEnvelope'
import { getRightParent } from './shared/structure'
import { getEnvelopes } from './getEnvelopes'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

type TPatches = {
  [DataEntity.Tag]?: TTagDraft
  [DataEntity.Account]?: TAccountPatch
  [DataEntity.Merchant]?: TMerchantPatch
  meta?: TEnvelopeMetaPatch
}

export const patchEnvelope =
  (draft: TEnvelopeDraft | TEnvelopeDraft[]): AppThunk =>
  (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())

    const patchLists = {
      tag: [] as TTagDraft[],
      account: [] as TAccountPatch[],
      merchant: [] as TMerchantPatch[],
      meta: [] as TEnvelopeMetaPatch[],
    }

    const drafts = Array.isArray(draft) ? draft : [draft]
    drafts.forEach(draft => {
      const patch = getChanges(draft, envelopes)
      if (patch.tag) patchLists.tag.push(patch.tag)
      if (patch.account) patchLists.account.push(patch.account)
      if (patch.merchant) patchLists.merchant.push(patch.merchant)
      if (patch.meta) patchLists.meta.push(patch.meta)
    })

    if (patchLists.tag.length) dispatch(tagModel.patchTag(patchLists.tag))
    if (patchLists.account.length)
      dispatch(accountModel.patchAccount(patchLists.account))
    if (patchLists.merchant.length)
      dispatch(merchantModel.patchMerchant(patchLists.merchant))
    if (patchLists.meta.length) dispatch(patchEnvelopeMeta(patchLists.meta))
    return
  }

/**
 * Returns a set of changes that need to be performed to apply given patch.
 * This set includes:
 * - Patches for tags
 * - Patches for accounts
 * - Patches for merchants
 * - Patches for metadata
 */
function getChanges(draft: TEnvelopeDraft, envelopes: ById<TEnvelope>) {
  const current = envelopes[draft.id]
  const { type, id } = envId.parse(draft.id)
  const patches: TPatches = {}
  keys(draft).forEach(key => {
    if (current[key] === draft[key]) return
    switch (key) {
      case 'id':
      case 'type':
      case 'entityId':
      case 'name':
      case 'symbol':
      case 'colorGenerated':
      case 'colorDisplay':
      case 'children':
      case 'index':
        // Read-only props
        break

      case 'originalName':
        if (
          type === EnvType.Tag ||
          type === EnvType.Account ||
          type === EnvType.Merchant
        ) {
          patches[type] ??= { id }
          patches[type]!.title = draft.originalName
        }
        break

      case 'colorHex':
        if (type === EnvType.Tag) {
          patches[type] ??= { id }
          patches[type]!.color = getTagColor(draft.colorHex)
        }
        break

      case 'parent':
        if (type === EnvType.Tag) {
          patches[type] ??= { id }
          patches[type]!.parent = getRightTagParent(draft.parent, envelopes)
        } else {
          updateMeta(key, getRightParent(draft.parent, envelopes) || undefined)
        }
        break

      case 'indexRaw':
        updateMeta('index', draft[key])
        break

      case 'visibility':
      case 'group':
      case 'comment':
      case 'currency':
      case 'keepIncome':
      case 'carryNegatives':
        updateMeta(key, draft[key])
        break

      default:
        console.log('Unknown key in envelope ' + key)
        break
    }
  })
  return patches

  function updateMeta<T extends keyof TEnvelopeMetaPatch>(
    key: T,
    value: TEnvelopeMetaPatch[T]
  ) {
    patches.meta ??= { id: draft.id }
    patches.meta[key] = value
  }
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
