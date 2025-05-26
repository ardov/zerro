import { v1 as uuidv1 } from 'uuid'
import { OptionalExceptFor, TTag } from '6-shared/types'
import { t } from 'i18next'

type TagDraft = OptionalExceptFor<TTag, 'user' | 'title'>

export function makeTag(raw: TagDraft): TTag {
  return {
    id: raw.id || uuidv1(),
    changed: raw.changed || Date.now(),
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
  }
}

export const nullTag = makeTag({
  // TODO: ??? i18n
  title: t('common:tagNull'),
  user: 0,
  id: 'null',
  budgetIncome: true,
  budgetOutcome: true,
})
