import { useAppSelector } from 'store'
import { getPopulatedTags, getTags, getTagsTree } from './model'
import { makeTag } from './makeTag'

export type { TagTreeNode } from './model'
export type { TTagPopulated } from './populateTags'

export const tagModel = {
  // Selectors
  getTags,
  /** @deprecated Read via `selectCorePopulatedTags` from `core-next/adapters/redux` */
  getPopulatedTags,
  getTagsTree,

  // Hooks
  useTags: () => useAppSelector(getTags),
  useTagsTree: () => useAppSelector(getTagsTree),

  // Helpers
  makeTag,
}
