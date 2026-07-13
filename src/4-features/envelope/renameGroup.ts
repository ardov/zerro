import { envelopes as coreEnvelopes } from 'zerro-core/redux'

import { AppThunk } from 'store/index'

export function renameGroup(prevName: string, nextName: string): AppThunk {
  return (dispatch, getState) => {
    const trimmedNext = nextName.trim()
    if (prevName === nextName || prevName === trimmedNext) return
    if (!prevName || !trimmedNext) return

    const structure = coreEnvelopes.selectStructure(getState())
    if (!structure.some(group => group.id === prevName)) return

    const input = coreEnvelopes
      .toEnvelopeStructureInput(structure)
      .map(group =>
        group.group === prevName ? { ...group, group: trimmedNext } : group
      )

    dispatch(coreEnvelopes.applyStructure(input))
  }
}
