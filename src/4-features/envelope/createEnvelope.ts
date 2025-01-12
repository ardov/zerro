import { AppThunk } from 'store'
import { tagModel } from '5-entities/tag'
import { envelopeModel, EnvType, TEnvelope } from '5-entities/envelope'
import { t } from 'i18next'

export const createEnvelope =
  (draft: Partial<TEnvelope>): AppThunk =>
  (dispatch, getState) => {
    const newTag = dispatch(
      tagModel.createTag({
        title: draft.name || t('tagNew', { ns: 'common' }),
        showOutcome: true,
      })
    )[0].id
    const id = envelopeModel.makeId(EnvType.Tag, newTag)
    dispatch(envelopeModel.patchEnvelope({ ...draft, id }))
    return id
  }

export const createEnvelopeInGroup =
  (group: string): AppThunk =>
  (dispatch, getState) => {
    // In order for group not jump to the top of the list
    // we need to find the first envelope in the group
    // and create a new envelope right before it
    const envelopes = envelopeModel.getEnvelopes(getState())
    const structure = envelopeModel.getEnvelopeStructure(getState())
    const groupNode = structure.find(gr => gr.id === group)
    if (!groupNode) return
    const firstEnvId = groupNode.children[0]?.id
    const firstEnvIdx = envelopes[firstEnvId].indexRaw || 0
    return dispatch(createEnvelope({ group, indexRaw: firstEnvIdx - 1 }))
  }
