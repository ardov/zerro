import { getBudgetId } from 'store/data/budgets'
import { Diff } from 'types'

/**
 * Mutates first diff
 */
export function mergeDiffs(d1: Diff, d2: Diff) {
  const merge = (key: keyof Diff) => {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (!d2[key]) return
    if (d1[key]) {
      d2[key]?.forEach((el: any) => {
        const id = getId(el)
        // @ts-ignore
        const filtered = d1[key]?.filter((el: any) => id !== getId(el))
        d1[key] = [...filtered, el]
      })
    } else {
      // @ts-ignore
      d1[key] = d2[key]
    }
  }

  if (d2.serverTimestamp) d1.serverTimestamp = d2.serverTimestamp
  if (d2.deletion) {
    if (d1.deletion) d1.deletion = d1.deletion.concat(d2.deletion)
    else d1.deletion = d2.deletion
  }
  if (d2.instrument) merge('instrument')
  if (d2.country) merge('country')
  if (d2.company) merge('company')
  if (d2.user) merge('user')
  if (d2.account) merge('account')
  if (d2.merchant) merge('merchant')
  if (d2.tag) merge('tag')
  if (d2.budget) merge('budget')
  if (d2.reminder) merge('reminder')
  if (d2.reminderMarker) merge('reminderMarker')
  if (d2.transaction) merge('transaction')
}

const getId = (el: any): string => el.id || getBudgetId(el)
