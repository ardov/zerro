import { createSelector } from '@reduxjs/toolkit'
import { Modify, TTag } from '@shared/types'
import { RootState } from '@store'
import { TTagPopulated } from './types'
import populateTags from './populateTags'

// SELECTORS
export const getTags = (state: RootState) => state.data.current.tag

export const getTag = (state: RootState, id: string): TTag | undefined =>
  getTags(state)[id]

export const getPopulatedTags = createSelector([getTags], populateTags)

export const getPopulatedTag = (state: RootState, id: string) =>
  getPopulatedTags(state)[id]

// TODO below are deprecated methods

export type TagTreeNode = Modify<TTagPopulated, { children: TTagPopulated[] }>
export const getTagsTree = createSelector([getPopulatedTags], tags => {
  let result = []
  for (const id in tags) {
    if (tags[id].parent) continue
    const tag = { ...tags[id], children: [] } as TagTreeNode
    if (tags[id].children)
      tag.children = tags[id].children.map(id => tags[id]).sort(compareTags)
    result.push(tag)
  }
  result.sort(compareTags)
  return result
})

function compareTags<T extends { name: string }>(tag1: T, tag2: T) {
  return tag1.name.localeCompare(tag2.name)
}
