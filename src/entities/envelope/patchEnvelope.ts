import {
  ById,
  DataEntity,
  OptionalExceptFor,
  TEnvelopeId,
  TTagId,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { AppThunk } from '@store'
import { patchTag, TTagDraft } from '@entities/tag'
import { getEnvelopes } from './getEnvelopes'
import { parseEnvelopeId } from './shared/helpers'
import { patchEnvelopeMeta, TEnvelopeMetaPatch } from './shared/metaData'
import { hex2int, isHEX } from '@shared/helpers/color'
import { TEnvelope } from './shared/makeEnvelope'
import { getRightParent } from './shared/structure'
import { patchAccount, TAccountDraft } from '@entities/account'
import { patchMerchant, TMerchantDraft } from '@entities/merchant'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

type TPatches = {
  [DataEntity.Tag]?: TTagDraft
  [DataEntity.Account]?: TAccountDraft
  [DataEntity.Merchant]?: TMerchantDraft
  meta?: TEnvelopeMetaPatch
}

export const patchEnvelope =
  (draft: TEnvelopeDraft | TEnvelopeDraft[]): AppThunk =>
  (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    const drafts = Array.isArray(draft) ? draft : [draft]
    const patches = drafts.map(d => toPatches(d, envelopes))
    const tagPatches = patches.reduce(
      (arr, p) => (p.tag ? [...arr, p.tag] : arr),
      [] as TTagDraft[]
    )
    const accPatches = patches.reduce(
      (arr, p) => (p.account ? [...arr, p.account] : arr),
      [] as TAccountDraft[]
    )
    const merchantPatches = patches.reduce(
      (arr, p) => (p.merchant ? [...arr, p.merchant] : arr),
      [] as TMerchantDraft[]
    )
    const metaPatches = patches.reduce(
      (arr, p) => (p.meta ? [...arr, p.meta] : arr),
      [] as TEnvelopeMetaPatch[]
    )
    if (tagPatches.length) dispatch(patchTag(tagPatches))
    if (accPatches.length) dispatch(patchAccount(accPatches))
    if (merchantPatches.length) dispatch(patchMerchant(merchantPatches))
    if (metaPatches.length) dispatch(patchEnvelopeMeta(metaPatches))
    return
  }

const funcs: {
  [key in keyof TEnvelope]: (
    draft: TEnvelopeDraft,
    patches: TPatches,
    envelopes: ById<TEnvelope>
  ) => void
} = {
  id: () => {}, // Read only
  type: () => {}, // Read only
  entityId: () => {}, // Read only
  name: () => {}, // Read only
  symbol: () => {},
  colorGenerated: () => {}, // Read only
  children: () => {}, // Read only
  index: () => {}, // Read only

  originalName: (draft, patches) => {
    const { type, id } = parseEnvelopeId(draft.id)
    if (
      type === DataEntity.Tag ||
      type === DataEntity.Account ||
      type === DataEntity.Merchant
    ) {
      patches[type] = { ...patches[type], id, title: draft.originalName }
    }
  },

  color: (draft, patches) => {
    const { type, id } = parseEnvelopeId(draft.id)
    if (type === DataEntity.Tag) {
      patches[type] = { ...patches[type], id, color: getTagColor(draft.color) }
    }
  },

  parent: (draft, patches, envelopes) => {
    const { type, id } = parseEnvelopeId(draft.id)
    if (type === DataEntity.Tag) {
      patches[type] = {
        ...patches[type],
        id,
        parent: getRightTagParent(draft.parent, envelopes),
      }
    } else {
      patches.meta = {
        ...patches.meta,
        id: draft.id,
        parent: getRightParent(draft.parent, envelopes) || undefined,
      }
    }
  },

  // Virtual properties from metadata
  visibility: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      visibility: draft.visibility,
    }
  },
  indexRaw: (draft, patches) => {
    patches.meta = { ...patches.meta, id: draft.id, index: draft.indexRaw }
  },
  group: (draft, patches) => {
    patches.meta = { ...patches.meta, id: draft.id, group: draft.group }
  },
  comment: (draft, patches) => {
    patches.meta = { ...patches.meta, id: draft.id, comment: draft.comment }
  },
  currency: (draft, patches) => {
    patches.meta = { ...patches.meta, id: draft.id, currency: draft.currency }
  },
  keepIncome: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      keepIncome: draft.keepIncome,
    }
  },
  carryNegatives: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      carryNegatives: draft.carryNegatives,
    }
  },
}

function toPatches(draft: TEnvelopeDraft, envelopes: ById<TEnvelope>) {
  if (!draft.id) throw new Error('Trying to patch tag without id')
  let current = envelopes[draft.id]
  if (!current) throw new Error('Envelope not found')

  if (current.type === 'payee') {
    return {} as TPatches
    throw new Error('Trying to patch payee envelope')
  }
  const patches: TPatches = {}
  keys(draft).forEach(key => {
    if (current[key] !== draft[key]) {
      funcs[key](draft, patches, envelopes)
    }
  })
  return patches
}

function getRightTagParent(
  parent: TEnvelopeId | null | undefined,
  envelopes: ById<TEnvelope>
): TTagId | null {
  const id = getRightParent(parent, envelopes)
  if (!id) return null
  const parsed = parseEnvelopeId(id)
  if (parsed.type !== DataEntity.Tag) throw new Error('Parent is not tag')
  if (parsed.id === 'null') return null
  return parsed.id
}

function getTagColor(color?: string | null) {
  if (isHEX(color)) {
    return hex2int(color)
  }
  return null
}
