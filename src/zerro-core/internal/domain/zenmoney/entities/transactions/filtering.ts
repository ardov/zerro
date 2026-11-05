import { toISOMonth } from '../../../foundation/date'
import { keys } from '../../../foundation/keys'
import type { TAccountId } from '../accounts'
import type { TISOMonth } from '../../primitives'
import type { TTagId } from '../tags'
import {
  getTransactionType,
  isDeletedTransaction,
  isTransactionViewed,
  TrType,
} from './read'
import type { TTransaction } from './types'

type ValueCondition =
  | number
  | string
  | boolean
  | null
  | {
      eq?: number | string | boolean | null
      neq?: number | string | boolean | null
      gt?: number | string
      gte?: number | string
      lt?: number | string
      lte?: number | string
      contains?: string
      in?: ValueCondition[]
    }

type StringCondition<T extends string> =
  | T
  | null
  | {
      eq?: T | null
      neq?: T | null
      gt?: T
      gte?: T
      lt?: T
      lte?: T
      contains?: T
      in?: StringCondition<T>[]
    }

type BasicConditions = {
  [key in keyof TTransaction]?: ValueCondition
}

type AdditionalConditions = {
  search?: null | string
  type?: StringCondition<TrType>
  showDeleted?: boolean
  isViewed?: boolean
  /**
   * A tag condition excludes transfers and debts. `null` means no tags.
   */
  tags?: null | TTagId[]
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

export const compileTransactionFilter =
  (conditions?: TrCondition) =>
  (transaction: TTransaction): boolean =>
    checkConditions(transaction, conditions)

function checkConditions(
  transaction: TTransaction,
  conditions?: TrCondition
): boolean {
  if (!checkDeleted(transaction, conditions?.showDeleted)) return false
  if (!conditions) return true
  return keys(conditions).every(key => checkKey(key, transaction, conditions))
}

function checkKey(
  key: keyof TrCondition,
  transaction: TTransaction,
  conditions: TrCondition
): boolean {
  if (conditions[key] === undefined) return true

  switch (key) {
    case 'search':
      return checkSearch(transaction, conditions.search)
    case 'type':
      return checkValue(getTransactionType(transaction), conditions.type)
    case 'showDeleted':
      return checkDeleted(transaction, conditions.showDeleted)
    case 'isViewed':
      return checkViewed(transaction, conditions.isViewed)
    case 'tags':
      return checkTags(transaction, conditions.tags)
    case 'mainTag':
      return checkValue(transaction.tag?.[0] || null, conditions.mainTag)
    case 'month':
      return checkValue(toISOMonth(transaction.date), conditions.month)
    case 'account':
      return (
        checkValue(transaction.incomeAccount, conditions.account) ||
        checkValue(transaction.outcomeAccount, conditions.account)
      )
    case 'amount':
      return checkAmount(transaction, conditions.amount)
    case 'or':
      return (
        conditions.or?.some(condition =>
          checkConditions(transaction, condition)
        ) ?? true
      )
    case 'and':
      return (
        conditions.and?.every(condition =>
          checkConditions(transaction, condition)
        ) ?? true
      )
    default:
      if (key in transaction) {
        return checkValue(transaction[key], conditions[key])
      }
      throw new Error(`Unknown filtering field: ${String(key)}`)
  }
}

function checkValue(
  value: any,
  condition?: ValueCondition | StringCondition<string>
): boolean {
  if (condition === undefined) return true
  if (Array.isArray(value)) {
    return value.some(item => checkValue(item, condition))
  }
  if (typeof condition !== 'object' || condition === null) {
    return condition === value
  }
  if (condition.eq !== undefined && condition.eq !== value) return false
  if (condition.neq !== undefined && condition.neq === value) return false
  if (condition.gt !== undefined && value <= condition.gt) return false
  if (condition.gte !== undefined && value < condition.gte) return false
  if (condition.lt !== undefined && value >= condition.lt) return false
  if (condition.lte !== undefined && value > condition.lte) return false
  if (
    condition.contains !== undefined &&
    !String(value).includes(condition.contains)
  ) {
    return false
  }
  if (
    condition.in !== undefined &&
    !condition.in.some(item => checkValue(value, item))
  ) {
    return false
  }
  return true
}

function checkSearch(
  transaction: TTransaction,
  condition?: TrCondition['search']
): boolean {
  const search = condition?.toUpperCase()
  return Boolean(
    !search ||
    transaction.comment?.toUpperCase().includes(search) ||
    transaction.payee?.toUpperCase().includes(search)
  )
}

function checkDeleted(
  transaction: TTransaction,
  showDeleted?: boolean
): boolean {
  return !isDeletedTransaction(transaction) || Boolean(showDeleted)
}

function checkViewed(transaction: TTransaction, viewed?: boolean): boolean {
  return viewed === undefined || isTransactionViewed(transaction) === viewed
}

function checkTags(
  transaction: TTransaction,
  tags?: TrCondition['tags']
): boolean {
  if (!tags?.length) return true
  const type = getTransactionType(transaction)
  if (type !== TrType.Income && type !== TrType.Outcome) return false
  return tags.some(tagId =>
    tagId === 'null'
      ? !transaction.tag?.length
      : Boolean(transaction.tag?.includes(tagId))
  )
}

function checkAmount(
  transaction: TTransaction,
  amount?: ValueCondition
): boolean {
  const type = getTransactionType(transaction)
  if (type === TrType.Income) return checkValue(transaction.income, amount)
  if (type === TrType.Outcome) return checkValue(transaction.outcome, amount)
  return (
    checkValue(transaction.income, amount) ||
    checkValue(transaction.outcome, amount)
  )
}
