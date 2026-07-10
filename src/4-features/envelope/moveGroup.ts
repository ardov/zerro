import { AppThunk } from 'store/index'
import {
  applyEnvelopeStructure,
  selectCoreEnvelopeStructure,
  toEnvelopeStructureInput,
} from 'core-next/adapters/redux'
import { arrayMove } from './arrayMove'

export function moveGroup(fromIdx: number, toIdx: number): AppThunk {
  return (dispatch, getState) => {
    const structure = selectCoreEnvelopeStructure(getState())
    if (fromIdx === toIdx) return
    if (!structure[fromIdx] || !structure[toIdx]) return

    const updatedStructure = [...structure]
    arrayMove(updatedStructure, fromIdx, toIdx)

    dispatch(applyEnvelopeStructure(toEnvelopeStructureInput(updatedStructure)))
  }
}
