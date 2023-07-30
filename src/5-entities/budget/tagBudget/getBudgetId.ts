import { TTagId } from '6-shared/types'
import { TBudgetId } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { TDateDraft } from '6-shared/types'
import { toBudgetId } from '6-shared/api/zm-adapter'

export function getTagBudgetId(
  date: TDateDraft,
  tag: TTagId | null
): TBudgetId {
  return toBudgetId(toISODate(date), tag)
}
