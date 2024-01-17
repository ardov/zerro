import type {
  TAccountId,
  TISOMonth,
  TTagId,
  TTransaction,
} from '6-shared/types'
import type { ValueCondition, StringCondition } from './basicFiltering'

import { keys } from '6-shared/helpers/keys'
import { toISOMonth } from '6-shared/helpers/date'

import { getType, isDeleted, isViewed, TrType } from './helpers'
import { checkValue } from './basicFiltering'

type BasicConditions = {
  [key in keyof TTransaction]?: ValueCondition
}

type AdditionalConditions = {
  search?: null | string
  type?: StringCondition<TrType>
  showDeleted?: boolean
  isViewed?: boolean
  /**
   * Custom filtering condition for tags.
   * When it's used all transfers and debts are excluded from the result.
   */
  tags?: null | TTagId[] // Special case: null means "no tags"
  mainTag?: StringCondition<TTagId>
  month?: StringCondition<TISOMonth>
  account?: StringCondition<TAccountId>
  amount?: ValueCondition
}

export type TrCondition = BasicConditions &
  AdditionalConditions & {
    or?: TrCondition[]
    and?: TrCondition[]
  }

export const checkRaw =
  (conditions?: TrCondition) =>
  (tr: TTransaction): boolean =>
    checkConditions(tr, conditions)

function checkConditions(tr: TTransaction, conditions?: TrCondition): boolean {
  // Check if transaction is deleted even if it's not specified in conditions
  // (usually we don't want deleted transactions)
  if (!checkDeleted(tr, conditions?.showDeleted)) return false
  // No conditions - return true
  if (!conditions) return true
  // Now check all other conditions
  return keys(conditions).every(key => checkKey(key, tr, conditions))
}

/**
 * Checks if a transaction matches a given condition.
 * @param key key of the condition
 * @param tr transaction
 * @param conditions object with conditions
 */
function checkKey(
  key: keyof TrCondition,
  tr: TTransaction,
  conditions?: TrCondition
): boolean {
  if (!conditions || conditions[key] === undefined) return true

  switch (key) {
    /* Handle custom conditions */
    case 'search':
      return checkSearch(tr, conditions[key])
    case 'type':
      return checkType(tr, conditions[key])
    case 'showDeleted':
      return checkDeleted(tr, conditions[key])
    case 'isViewed':
      return checkIsViewed(tr, conditions[key])
    case 'tags':
      return checkTags(tr, conditions[key])
    case 'mainTag':
      return checkMainTag(tr, conditions[key])
    case 'month':
      return checkMonth(tr, conditions[key])
    case 'account':
      return checkAccount(tr, conditions[key])
    case 'amount':
      return checkAmount(tr, conditions[key])

    /* Handle logical operators */
    case 'or':
      return (
        conditions.or?.some(condition => checkConditions(tr, condition)) ?? true
      )
    case 'and':
      return (
        conditions.and?.every(condition => checkConditions(tr, condition)) ??
        true
      )

    /* Handle basic conditions */
    default:
      if (key in tr) {
        return checkValue(tr[key], conditions[key])
      } else {
        throw new Error('Unknown filtering field: ' + key)
      }
  }
}

// Custom condition handlers

function checkSearch(tr: TTransaction, condition?: TrCondition['search']) {
  const upperCondition = condition?.toUpperCase()
  return Boolean(
    !upperCondition ||
      tr.comment?.toUpperCase().includes(upperCondition) ||
      tr.payee?.toUpperCase().includes(upperCondition)
  )
}

function checkType(tr: TTransaction, condition?: TrCondition['type']) {
  return checkValue(getType(tr), condition)
}

function checkDeleted(
  tr: TTransaction,
  condition?: TrCondition['showDeleted']
) {
  if (isDeleted(tr)) return Boolean(condition)
  return true
}

function checkIsViewed(tr: TTransaction, condition?: TrCondition['isViewed']) {
  if (condition === undefined) return true
  return isViewed(tr) === condition
}

function checkTags(tr: TTransaction, condition?: TrCondition['tags']) {
  if (!condition || condition.length === 0) return true
  // At this point there is a condition
  // That means that only income or outcome transactions can match
  const trType = getType(tr)
  if (trType !== TrType.Income && trType !== TrType.Outcome) return false

  // Otherwise check if any of the tags in condition match transaction tags
  return condition.some(tagId => {
    if (tagId === 'null') {
      // Special case: null means "no tags"
      return tr.tag === null || tr.tag.length === 0
    }
    return tr.tag?.includes(tagId)
  })
}

function checkMainTag(tr: TTransaction, condition?: TrCondition['mainTag']) {
  const mainTag = tr.tag?.[0] || null
  return checkValue(mainTag, condition)
}

function checkMonth(tr: TTransaction, condition?: TrCondition['month']) {
  return checkValue(toISOMonth(tr.date), condition)
}

function checkAccount(tr: TTransaction, condition?: TrCondition['account']) {
  return (
    checkValue(tr.incomeAccount, condition) ||
    checkValue(tr.outcomeAccount, condition)
  )
}

function checkAmount(tr: TTransaction, condition?: TrCondition['amount']) {
  const type = getType(tr)
  if (type === TrType.Income) return checkValue(tr.income, condition)
  if (type === TrType.Outcome) return checkValue(tr.outcome, condition)
  return checkValue(tr.income, condition) || checkValue(tr.outcome, condition)
}
