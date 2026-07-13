import { AppThunk } from 'store/index'
import { envelopes as coreEnvelopes } from 'zerro-core/redux'

import { arrayMove } from './arrayMove'

export function moveGroup(fromIdx: number, toIdx: number): AppThunk {
  return (dispatch, getState) => {
    const structure = coreEnvelopes.selectStructure(getState())
    if (fromIdx === toIdx) return
    if (!structure[fromIdx] || !structure[toIdx]) return

    const updatedStructure = [...structure]
    arrayMove(updatedStructure, fromIdx, toIdx)

    dispatch(
      coreEnvelopes.applyStructure(
        coreEnvelopes.toEnvelopeStructureInput(updatedStructure)
      )
    )
  }
}
