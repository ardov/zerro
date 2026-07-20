import { core } from 'zerro-core/redux'

import type { AppThunk } from 'store/index'

export function renameGroup(prevName: string, nextName: string): AppThunk {
  return (dispatch, getState) => {
    const trimmedNext = nextName.trim()
    if (prevName === nextName || prevName === trimmedNext) return
    if (!prevName || !trimmedNext) return

    const structure = core.envelopes.selectStructure(getState())
    if (!structure.some(group => group.id === prevName)) return

    const input = core.envelopes
      .toEnvelopeStructureInput(structure)
      .map(group =>
        group.group === prevName ? { ...group, group: trimmedNext } : group
      )

    dispatch(core.envelopes.applyStructure(input))
  }
}
