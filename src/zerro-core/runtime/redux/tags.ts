export { nullTag, presentTags, type TTagPopulated } from './tagPresentation'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import * as settings from './settings'
import { selectData } from './state'
import { presentTags } from './tagPresentation'

export const selectAll = (state: RootState) => selectData(state).tag
export const selectPopulated = createSelector(
  [selectAll, settings.select],
  presentTags
)
