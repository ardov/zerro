export { nullTag, populateTags, type TTagPopulated } from './tagPresentation'
import { createSelector } from '@reduxjs/toolkit'
import { buildTagStructure } from '../domain/zenmoney'
import * as settings from './settings'
import { selectTagSlice } from './state'
import { presentTags } from './tagPresentation'

export const selectStructure = createSelector([selectTagSlice], tags =>
  buildTagStructure({ tags })
)
export const selectPopulated = createSelector(
  [selectStructure, settings.select],
  presentTags
)
