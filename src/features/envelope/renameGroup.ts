import { envelopeModel, TEnvelopeDraft } from '@entities/envelope'
import { AppThunk } from '@store/index'

export function renameGroup(prevName: string, nextName: string): AppThunk {
  return (dispatch, getState) => {
    let trimmedNext = nextName.trim()
    if (prevName === nextName || prevName === trimmedNext) return
    if (!prevName || !trimmedNext) return
    const envelopes = envelopeModel.getEnvelopes(getState())
    const patches: TEnvelopeDraft[] = []

    Object.values(envelopes).forEach(e => {
      if (e.group !== prevName) return
      patches.push({ id: e.id, group: trimmedNext })
    })

    if (patches.length) dispatch(envelopeModel.patchEnvelope(patches))
  }
}
