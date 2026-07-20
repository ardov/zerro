import { AppThunk } from 'store/index'
import * as core from 'zerro-core/redux'

import { arrayMove } from './arrayMove'

export function moveGroup(fromIdx: number, toIdx: number): AppThunk {
  return (dispatch, getState) => {
    const structure = core.envelopes.selectStructure(getState())
    if (fromIdx === toIdx) return
    if (!structure[fromIdx] || !structure[toIdx]) return

    const updatedStructure = [...structure]
    arrayMove(updatedStructure, fromIdx, toIdx)

    dispatch(
      core.envelopes.applyStructure(
        core.envelopes.toEnvelopeStructureInput(updatedStructure)
      )
    )
  }
}
