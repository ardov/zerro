import { TTagId } from '@shared/types'
import { TBudgetId } from '@shared/types'
import { toISODate } from '@shared/helpers/date'
import { TDateDraft } from '@shared/types'
import { toBudgetId } from '@shared/api/zm-adapter'

export function getTagBudgetId(
  date: TDateDraft,
  tag: TTagId | null
): TBudgetId {
  return toBudgetId(toISODate(date), tag)
}
