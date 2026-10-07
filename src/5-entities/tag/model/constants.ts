import type { TTagId } from '6-shared/types'

/** Id of the virtual tag for transactions without a category */
export const nullTagId: TTagId = 'null'

/**
 * Placeholder used while editing several transactions at once. It stands for
 * "keep the tags each transaction already has" and must never be saved.
 */
export const mixedTagId: TTagId = 'mixed'
