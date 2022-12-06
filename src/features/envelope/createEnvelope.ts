import { DataEntity } from '@shared/types'

import { AppThunk } from '@store'
import { createTag } from '@entities/tag'
import { envelopeModel, TEnvelope } from '@entities/envelope'

export const createEnvelope =
  (draft: Partial<TEnvelope>): AppThunk =>
  (dispatch, getState) => {
    const newTag = dispatch(
      createTag({ title: draft.name || 'Новая категория', showOutcome: true })
    )[0].id
    const id = envelopeModel.makeId(DataEntity.Tag, newTag)
    dispatch(envelopeModel.patchEnvelope({ ...draft, id }))
  }
