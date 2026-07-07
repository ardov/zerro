import type { ById, OptionalExceptFor, TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { EnvType, type TEnvelopeId } from '../envelope-id'
import {
  compilePatchEnvelopeMeta,
  type TEnvelopeMetaPatch,
} from '../envelope-meta'
import type { TEnvelope } from './build'

export type TEnvelopeDraft = OptionalExceptFor<TEnvelope, 'id'>

export function compilePatchEnvelopeMetadata(
  data: TDataStore,
  envelopes: ById<TEnvelope>,
  draft: TEnvelopeDraft | TEnvelopeDraft[],
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const metaPatches = toArray(draft)
    .map(item => getMetadataPatch(item, envelopes))
    .filter((patch): patch is TEnvelopeMetaPatch => !!patch)

  if (!metaPatches.length) return {}
  return compilePatchEnvelopeMeta(data, metaPatches, ctx)
}

function getMetadataPatch(
  draft: TEnvelopeDraft,
  envelopes: ById<TEnvelope>
): TEnvelopeMetaPatch | null {
  const current = envelopes[draft.id]
  if (!current) throw new Error('Envelope not found')

  const meta: TEnvelopeMetaPatch = { id: draft.id }

  Object.entries(draft).forEach(([key, value]) => {
    const draftKey = key as keyof TEnvelopeDraft
    if (current[draftKey] === value) return

    switch (draftKey) {
      case 'indexRaw':
        meta.index = value as TEnvelope['indexRaw']
        break

      case 'parent':
        if (current.type !== EnvType.Tag) {
          meta.parent =
            getRightParent(value as TEnvelope['parent'], envelopes) || undefined
        }
        break

      case 'visibility':
      case 'group':
      case 'comment':
      case 'currency':
      case 'keepIncome':
      case 'carryNegatives':
        meta[draftKey] = value as never
        break
    }
  })

  return Object.keys(meta).length > 1 ? meta : null
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

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
