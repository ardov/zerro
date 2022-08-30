import { createSelector } from '@reduxjs/toolkit'
import { Modify, ITag, TTagId } from '@shared/types'
import { RootState } from '@store'
import { compareTags } from '@entities/hiddenData/tagOrder'
import { TTagPopulated } from './types'
import populateTags from './populateTags'

// SELECTORS
export const getTags = (state: RootState) => state.data.current.tag

export const getTag = (state: RootState, id: string): ITag | undefined =>
  getTags(state)[id]

export const getPopulatedTags = createSelector([getTags], populateTags)

export const getPopulatedTag = (state: RootState, id: string) =>
  getPopulatedTags(state)[id]

// TODO below are deprecated methods

export type TagTreeNode = Modify<TTagPopulated, { children: TTagPopulated[] }>
export const getTagsTree = createSelector(
  [getPopulatedTags, compareTags],
  (tags, compare) => {
    let result = []
    for (const id in tags) {
      if (tags[id].parent) continue
      const tag = { ...tags[id], children: [] } as TagTreeNode
      if (tags[id].children)
        tag.children = tags[id].children.map(id => tags[id]).sort(compare)
      result.push(tag)
    }
    result.sort(compare)
    return result
  }
)

export const getTagLinks = createSelector([getPopulatedTags], tags => {
  let result: {
    [tagId: string]: TTagId[]
  } = {}
  for (const id in tags) {
    if (tags[id].parent) continue
    result[id] = tags[id].children || []
  }
  return result
})
