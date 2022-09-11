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
import { patchMerchant } from '@entities/merchant'

type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

type TPatches = {
  [DataEntity.Tag]?: TTagDraft
  [DataEntity.Account]?: TAccountDraft
  [DataEntity.Merchant]?: any
  meta?: TEnvelopeMetaPatch
}

export const patchEnvelope =
  (draft: TEnvelopeDraft): AppThunk =>
  (dispatch, getState) => {
    const envelopes = getEnvelopes(getState())
    const patches = toPatches(draft, envelopes)
    if (patches.tag) dispatch(patchTag(patches.tag))
    if (patches.account) dispatch(patchAccount(patches.account))
    if (patches.merchant) dispatch(patchMerchant(patches.merchant))
    if (patches.meta) dispatch(patchEnvelopeMeta(patches.meta))
    return
  }

const funcs: {
  [key in keyof TEnvelope]: (
    draft: TEnvelopeDraft,
    patches: TPatches,
    envelopes: ById<TEnvelope>
  ) => void
} = {
  id: () => {},
  type: () => {},
  entityId: () => {},
  name: () => {},
  symbol: () => {},
  colorGenerated: () => {},
  children: () => {},
  index: () => {}, // Not here

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
  group: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      group: draft.group,
    }
  },
  comment: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      comment: draft.comment,
    }
  },
  currency: (draft, patches) => {
    patches.meta = {
      ...patches.meta,
      id: draft.id,
      currency: draft.currency,
    }
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
