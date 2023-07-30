import { AppThunk } from 'store'
import { createTag } from '5-entities/tag'
import { envelopeModel, EnvType, TEnvelope } from '5-entities/envelope'

export const createEnvelope =
  (draft: Partial<TEnvelope>): AppThunk =>
  (dispatch, getState) => {
    const newTag = dispatch(
      createTag({ title: draft.name || 'Новая категория', showOutcome: true })
    )[0].id
    const id = envelopeModel.makeId(EnvType.Tag, newTag)
    dispatch(envelopeModel.patchEnvelope({ ...draft, id }))
  }
