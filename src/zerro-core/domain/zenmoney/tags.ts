import type { EntityPatch, OptionalExceptFor } from '../shared/types'
import type { TCoreContext, TIntentPatch } from '../../types'
import type { TMsTime, TUnixTime } from './primitives'
import { compileEntityPatch, type TDataStore } from './store'
import { getRootUserId } from './users'
import type { TUserId } from './users'

export type TTagId = string
export type TIconName = string

export type TTag = {
  id: TTagId

  /** Root user ID. */
  user: TUserId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  /** Icon name. */
  icon: TIconName | null
  budgetIncome: boolean
  budgetOutcome: boolean
  /** Whether the tag is archived. */
  archive: boolean | null
  /** Whether the tag is shown in a list of income tags. */
  showIncome: boolean
  /** Whether the tag is shown in a list of outcome tags. */
  showOutcome: boolean
  title: string
  parent: TTagId | null
  color: number | null

  /** Used to be used in ZenMoney analytics */
  required: boolean | null
  /** Deprecated field */
  staticId: string | null
  /** Deprecated field */
  picture: string | null
}

/** Fields the factory cannot default: creation intent must supply them. */
export const tagRequiredFields = [
  'title',
] as const satisfies readonly (keyof TTag)[]

export const tagWritableFields = [
  'title',
  'icon',
  'budgetIncome',
  'budgetOutcome',
  'archive',
  'showIncome',
  'showOutcome',
  'parent',
  'color',
] as const satisfies readonly (keyof TTag)[]

export type TTagWritableField = (typeof tagWritableFields)[number]

export type TTagPatch = EntityPatch<TTag, TTagWritableField>

export type TZmTag = Omit<TTag, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}

export function makeTag(
  raw: OptionalExceptFor<TTag, 'user' | 'title'>,
  ctx: TCoreContext
): TTag {
  return {
    id: raw.id || (ctx.uuid() as TTagId),
    changed: raw.changed || ctx.now(),
    user: raw.user,
    title: raw.title,
    icon: raw.icon || null,
    budgetIncome: raw.budgetIncome || false,
    budgetOutcome: raw.budgetOutcome || false,
    required: raw.required || false,
    color: raw.color || null,
    picture: raw.picture || null,
    staticId: raw.staticId || null,
    showIncome: raw.showIncome || false,
    showOutcome: raw.showOutcome || false,
    parent: raw.parent || null,
    archive: raw.archive || false,
  }
}

export type TTagDraft = OptionalExceptFor<TTag, 'title'>

export function compilePatchTag(
  data: TDataStore,
  draft: TTagPatch | TTagPatch[]
): TIntentPatch {
  const list = Array.isArray(draft) ? draft : [draft]
  list.forEach(item => {
    if (item.id === 'null') throw new Error('Trying to patch null tag')
  })

  return compileEntityPatch(data, 'tag', list)
}

export function compileCreateTag(
  data: TDataStore,
  draft: TTagDraft,
  ctx: TCoreContext
): TIntentPatch {
  if (hasId(draft)) return compilePatchTag(data, draft)
  if (!draft.title) throw new Error('Trying to create tag without title')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    tag: [makeTag({ ...draft, user }, ctx)],
  }
}

function hasId(tag: Partial<TTag>): tag is TTagPatch {
  return !!tag.id
}
