export { presentTags, type TTagPopulated } from './tagPresentation'
export { getColorForString } from '../presentation/colors'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { selectData } from './state'
import { presentTags } from './tagPresentation'

export const selectAll = (state: RootState) => selectData(state).tag
export const selectPopulated = createSelector([selectAll], presentTags)
