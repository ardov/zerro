import {
  applyEnvelopeStructure,
  selectCoreEnvelopeStructure,
  toEnvelopeStructureInput,
} from 'zerro-core/redux'
import { AppThunk } from 'store/index'

export function renameGroup(prevName: string, nextName: string): AppThunk {
  return (dispatch, getState) => {
    let trimmedNext = nextName.trim()
    if (prevName === nextName || prevName === trimmedNext) return
    if (!prevName || !trimmedNext) return

    const structure = selectCoreEnvelopeStructure(getState())
    if (!structure.some(group => group.id === prevName)) return

    const input = toEnvelopeStructureInput(structure).map(group =>
      group.group === prevName ? { ...group, group: trimmedNext } : group
    )

    dispatch(applyEnvelopeStructure(input))
  }
}
