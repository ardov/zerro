import { useAppSelector } from 'store'
import { getPopulatedTags, getTags, getTagsTree } from './model'
import { makeTag } from './makeTag'
import { createTag, patchTag } from './thunks'

export type { TagTreeNode } from './model'
export type { TTagPopulated } from './populateTags'
export type { TTagDraft } from './thunks'

export const tagModel = {
  // Selectors
  getTags,
  getPopulatedTags,
  getTagsTree,

  // Hooks
  useTags: () => useAppSelector(getTags),
  usePopulatedTags: () => useAppSelector(getPopulatedTags),
  useTagsTree: () => useAppSelector(getTagsTree),

  // Helpers
  makeTag,

  // Thunks
  patchTag,
  createTag,
}
