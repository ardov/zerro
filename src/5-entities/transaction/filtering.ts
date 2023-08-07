import { TAccountId, TISOMonth, TTagId, TTransaction } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { getType, isDeleted, isViewed, TrType } from './helpers'
import type { KeyCondition, StringCondition } from './basicFiltering'
import { checkValue } from './basicFiltering'
import { toISOMonth } from '6-shared/helpers/date'

export type TrCondition = {
  [key in keyof TTransaction]?: KeyCondition
} & {
  search?: null | string
  type?: StringCondition<TrType>
  showDeleted?: boolean
  isViewed?: boolean
  tags?: null | TTagId[]
  mainTag?: StringCondition<TTagId>

  month?: StringCondition<TISOMonth>
  account?: StringCondition<TAccountId>
  amount?: KeyCondition
}

export type TrConditions =
  | TrCondition
  | ['AND' | 'OR', ...(TrCondition | TrConditions | undefined)[]]

export const checkRaw =
  (condition: TrConditions = {}) =>
  (tr: TTransaction): boolean => {
    if (Array.isArray(condition)) {
      const [operator, ...conditionList] = condition
      if (conditionList.length === 0) return true
      switch (operator) {
        case 'AND':
          return conditionList.every(condition => checkRaw(condition)(tr))
        case 'OR':
          return conditionList.some(condition => checkRaw(condition)(tr))
        default:
          throw new Error(`Invalid operator ${operator}`)
      }
    }
    return checkConditions(tr, condition)
  }

const checkConditions = (tr: TTransaction, conditions: TrCondition) => {
  return (
    // Always check is transaction deleted or not (usually we don't want deleted transactions)
    checkDeleted(tr, conditions.showDeleted) &&
    keys(conditions)
      .map(key => {
        if (conditions[key] === undefined) return true
        switch (key) {
          case 'search':
            return checkSearch(tr, conditions[key])
          case 'type':
            return checkValue(getType(tr), conditions[key])
          case 'showDeleted':
            return conditions[key] || !isDeleted(tr)
          case 'isViewed':
            return checkIsViewed(tr, conditions.isViewed)
          case 'tags':
            return checkTags(tr, conditions.tags, 'any')
          case 'mainTag': {
            const mainTag = tr.tag?.[0] || null
            return checkValue(mainTag, conditions[key])
          }
          case 'month':
            return checkValue(toISOMonth(tr.date), conditions[key])

          case 'account':
            return (
              checkValue(tr.incomeAccount, conditions[key]) ||
              checkValue(tr.outcomeAccount, conditions[key])
            )

          case 'amount': {
            const type = getType(tr)
            if (type === TrType.Income)
              return checkValue(tr.income, conditions[key])
            if (type === TrType.Outcome)
              return checkValue(tr.outcome, conditions[key])
            return (
              checkValue(tr.income, conditions[key]) ||
              checkValue(tr.outcome, conditions[key])
            )
          }

          default:
            if (key in tr) {
              return checkValue(tr[key], conditions[key])
            } else {
              throw new Error('Unknown filtering field: ' + key)
            }
        }
      })
      .every(Boolean)
  )
}

const checkSearch = (tr: TTransaction, search?: TrCondition['search']) => {
  if (!search) return true
  if (tr.comment?.toUpperCase().includes(search.toUpperCase())) return true
  if (tr.payee?.toUpperCase().includes(search.toUpperCase())) return true
  return false
}

const checkDeleted = (
  tr: TTransaction,
  showDeleted?: TrCondition['showDeleted']
) => showDeleted || !isDeleted(tr)

const checkTags = (
  tr: TTransaction,
  tags?: TrCondition['tags'],
  matchType: 'main' | 'any' = 'any'
) => {
  if (!tags || !tags.length) return true
  if (getType(tr) === 'transfer') return false
  if (!tr.tag) return tags.includes('null')

  if (matchType === 'main') return tags.includes(tr.tag[0])
  return tr.tag.some(id => tags.includes(id))
}

const checkIsViewed = (
  tr: TTransaction,
  condition?: TrCondition['isViewed']
) => {
  if (condition === undefined) return true
  return isViewed(tr) === condition
}
