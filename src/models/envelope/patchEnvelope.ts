import {
  ById,
  DataEntity,
  OptionalExceptFor,
  TEnvelopeId,
  TTagId,
} from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { AppThunk } from 'store'
import { patchTag, TTagDraft } from 'models/tag'
import { getEnvelopes, IEnvelope } from './getEnvelopes'
import { parseEnvelopeId } from './helpers'
import { patchEnvelopeMeta, TEnvelopeMetaPatch } from './metaData'

type TEnvelopeDraft = OptionalExceptFor<IEnvelope, 'id'>

export const patchEnvelope =
  (draft: TEnvelopeDraft): AppThunk =>
  (dispatch, getState) => {
    if (!draft.id) throw new Error('Trying to patch tag without id')
    let envelopes = getEnvelopes(getState())
    let current = envelopes[draft.id]
    if (!current) throw new Error('Envelope not found')

    if (current.type === 'payee') {
      throw new Error('Trying to patch payee envelope')
    }

    if (current.type === DataEntity.Tag) {
      let tagPatch: TTagDraft = { id: current.entityId }
      let metaPatch: TEnvelopeMetaPatch = { id: current.id }
      keys(draft).forEach(key => {
        switch (key) {
          case 'id': // ignore
          case 'type': // ignore
          case 'entityId': // ignore
          case 'children': // ignore
            break
          case 'name': // TODO need to store full title somewhere
            break
          case 'symbol': // TODO add icon support later
            break
          case 'color': // TODO add color support later
            break
          case 'showInBudget':
            tagPatch.showOutcome = draft.showInBudget
            break
          case 'parent':
            tagPatch.parent = getRightTagParent(envelopes, draft.parent)
            break
          case 'group':
          case 'comment':
          case 'currency':
            metaPatch[key] = draft[key]
            break
          case 'keepIncome':
          case 'carryNegatives':
            metaPatch[key] = draft[key]
            break
          default:
            throw new Error(`Unknown key ${key}`)
        }
      })
      if (keys(tagPatch).length > 1) dispatch(patchTag(tagPatch))
      if (keys(metaPatch).length > 1) dispatch(patchEnvelopeMeta(metaPatch))
      return
    }
    if (
      current.type === DataEntity.Account ||
      current.type === DataEntity.Merchant
    ) {
      let metaPatch: TEnvelopeMetaPatch = { id: current.id }
      keys(draft).forEach(key => {
        switch (key) {
          case 'id': // ignore
          case 'type': // ignore
          case 'entityId': // ignore
          case 'name': // ignore
          case 'symbol': // ignore
          case 'color': // ignore
          case 'children': // ignore
            break
          case 'showInBudget':
            metaPatch.showInBudget = draft.showInBudget
            break
          case 'parent':
            metaPatch.parent = getRightParent(envelopes, draft.parent)
            break
          case 'group':
          case 'comment':
          case 'currency':
            metaPatch[key] = draft[key]
            break
          case 'keepIncome':
          case 'carryNegatives':
            metaPatch[key] = draft[key]
            break
          default:
            throw new Error(`Unknown key ${key}`)
        }
      })
      if (keys(metaPatch).length > 1) dispatch(patchEnvelopeMeta(metaPatch))
      return
    }
  }

function getRightParent(
  envelopes: ById<IEnvelope>,
  parent?: TEnvelopeId | null
): TEnvelopeId | undefined {
  if (!parent) return undefined
  if (!envelopes[parent]) throw new Error('Parent envelope not found')
  if (envelopes[parent].parent) return envelopes[parent].parent as TEnvelopeId
  return parent
}
function getRightTagParent(
  envelopes: ById<IEnvelope>,
  parent?: TEnvelopeId | null
): TTagId | null {
  const id = getRightParent(envelopes, parent)
  if (!id) return null
  const parsed = parseEnvelopeId(id)
  if (parsed.type !== DataEntity.Tag) throw new Error('Parent is not tag')
  if (parsed.id === 'null') return null
  return parsed.id
}
