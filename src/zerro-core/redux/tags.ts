export { nullTag, populateTags, type TTagPopulated } from './tagPresentation'
import { createSelector } from '@reduxjs/toolkit'
import * as settings from './settings'
import { selectTagSlice } from './state'
import { presentTags } from './tagPresentation'

export const selectPopulated = createSelector(
  [selectTagSlice, settings.select],
  presentTags
)
