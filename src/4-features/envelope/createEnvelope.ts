import type { AppThunk } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import * as core from 'zerro-core/redux'

import { t } from 'i18next'

type TCreateEnvelopeInput = {
  name?: string
  group?: string
  index?: number
  comment?: string
}

export const createEnvelope =
  (input: TCreateEnvelopeInput = {}): AppThunk<TEnvelopeId> =>
  dispatch =>
    dispatch(
      core.envelopes.create({
        name: input.name || t('tagNew', { ns: 'common' }),
        group: input.group,
        index: input.index,
        comment: input.comment,
      })
    )

export const createEnvelopeInGroup =
  (group: string): AppThunk =>
  (dispatch, getState) => {
    // In order for group not jump to the top of the list
    // we need to find the first envelope in the group
    // and create a new envelope right before it
    const envelopes = core.envelopes.selectAll(getState())
    const structure = core.envelopes.selectStructure(getState())
    const groupNode = structure.find(gr => gr.id === group)
    if (!groupNode) return
    const firstEnvId = groupNode.children[0]?.id
    const firstEnvIdx = firstEnvId ? envelopes[firstEnvId].indexRaw || 0 : 0
    return dispatch(createEnvelope({ group, index: firstEnvIdx - 1 }))
  }
