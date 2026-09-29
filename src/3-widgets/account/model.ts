import type { TAccountId } from '@/6-shared/types'

export type AccountChoice = {
  id: TAccountId
  title: string
  archive: boolean
  fxCode: string
  isService?: boolean
}
export type AccountChoicesOptions = {
  selectedIds?: readonly TAccountId[]
  excludeIds?: readonly TAccountId[]
  query?: string
  expanded?: boolean
}

/** Exclusions are absolute; selected archived accounts remain available. */
export function accountChoices<T extends AccountChoice>(
  accounts: readonly T[],
  {
    selectedIds = [],
    excludeIds = [],
    query = '',
    expanded = false,
  }: AccountChoicesOptions = {}
) {
  const search = query.trim().toLocaleLowerCase()
  let hasMore = false
  const items = accounts.filter(account => {
    if (excludeIds.includes(account.id)) return false
    if (account.isService && !selectedIds.includes(account.id)) return false
    if (search)
      return `${account.title} ${account.fxCode}`
        .toLocaleLowerCase()
        .includes(search)
    if (!expanded && account.archive && !selectedIds.includes(account.id)) {
      hasMore = true
      return false
    }
    return true
  })
  return { items, hasMore }
}
