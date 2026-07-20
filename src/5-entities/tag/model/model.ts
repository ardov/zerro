import type { Modify } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import { core } from 'zerro-core/redux'

export type TTagPopulated = core.tags.TTagPopulated
export const getPopulatedTags = core.tags.selectPopulated

// TODO below are deprecated methods

export type TagTreeNode = Modify<TTagPopulated, { children: TTagPopulated[] }>
export const getTagsTree = createSelector([core.tags.selectPopulated], tags => {
  const result = []
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
