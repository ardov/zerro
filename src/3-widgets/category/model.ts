import type { TTagId } from '@/6-shared/types'

export type CategoryRowAction =
  | { type: 'replace'; index: number; id: TTagId }
  | { type: 'remove'; index: number }
  | { type: 'append'; id: TTagId }
  | { type: 'replaceTail'; from: number; id: TTagId }
  | { type: 'removeTail'; from: number }

/** The first category owns accounting; subsequent categories retain their order. */
export function applyCategoryAction(
  value: readonly TTagId[],
  action: CategoryRowAction
): TTagId[] {
  let next: TTagId[]
  switch (action.type) {
    case 'append':
      next = [...value, action.id]
      break
    case 'replace':
      next = value.map((id, index) => (index === action.index ? action.id : id))
      break
    case 'remove':
      next = value.filter((_, index) => index !== action.index)
      break
    case 'replaceTail':
      next = [...value.slice(0, action.from), action.id]
      break
    case 'removeTail':
      next = value.slice(0, action.from)
      break
  }
  return [...new Set(next)]
}

/** Mixed represents the entire differing suffix, never a synthetic category id. */
export function commonCategories(values: readonly (readonly TTagId[])[]) {
  const first = values[0] ?? []
  let length = 0
  while (
    length < first.length &&
    values.every(value => value[length] === first[length])
  )
    length++
  return {
    value: first.slice(0, length),
    mixed: values.some(value => value.length !== length),
  }
}

export type Category = {
  id: TTagId
  name: string
  title: string
  parent?: TTagId | null
  showIncome?: boolean
  showOutcome?: boolean
}
export type PreferredCategoryType = 'income' | 'outcome'

const UNCATEGORIZED_ID = 'null'

export type CategoryChoicesOptions = {
  value?: TTagId
  excludeIds?: readonly TTagId[]
  preferredType?: PreferredCategoryType
  query?: string
  showAll?: boolean
  includeUncategorized?: boolean
}

/** Exclusions may reappear as selectable ancestors; the caller deduplicates. */
export function categoryChoices<T extends Category>(
  categories: readonly T[],
  {
    value,
    excludeIds = [],
    preferredType,
    query = '',
    showAll = false,
    includeUncategorized = false,
  }: CategoryChoicesOptions
): { choices: { category: T; indent: number }[]; hasMore: boolean } {
  const available = categories.filter(
    category => includeUncategorized || category.id !== UNCATEGORIZED_ID
  )
  const byId = new Map(available.map(category => [category.id, category]))
  const visible = new Set<TTagId>()
  const eligible = new Set<TTagId>()
  const search = query.trim().toLocaleLowerCase()
  for (const category of available) {
    const excluded = excludeIds.includes(category.id) && category.id !== value
    const matches = search
      ? `${category.name} ${category.title}`
          .toLocaleLowerCase()
          .includes(search)
      : (includeUncategorized && category.id === UNCATEGORIZED_ID) ||
        showAll ||
        !preferredType ||
        category.id === value ||
        (preferredType === 'income'
          ? category.showIncome
          : category.showOutcome)
    if (!excluded) {
      eligible.add(category.id)
      if (matches) visible.add(category.id)
    }
  }
  for (const id of [...visible]) {
    const parent = byId.get(id)?.parent
    if (parent && byId.has(parent)) visible.add(parent)
  }
  const sorted = available
    .filter(category => visible.has(category.id))
    .sort((a, b) =>
      a.id === UNCATEGORIZED_ID
        ? -1
        : b.id === UNCATEGORIZED_ID
          ? 1
          : a.name.localeCompare(b.name)
    )
  const children = new Map<TTagId | null, T[]>()
  for (const category of sorted) {
    const parent =
      category.parent && visible.has(category.parent) ? category.parent : null
    children.set(parent, [...(children.get(parent) ?? []), category])
  }
  // Categories have exactly two levels: roots and their direct children.
  const choices = (children.get(null) ?? []).flatMap(category => [
    { category, indent: 0 },
    ...(children.get(category.id) ?? []).map(child => ({
      category: child,
      indent: 1,
    })),
  ])
  return {
    choices,
    hasMore: !search && !showAll && [...eligible].some(id => !visible.has(id)),
  }
}
