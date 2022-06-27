import {
  TAccountId,
  TTagId,
  TTransaction,
  TrType,
  TDateDraft,
} from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { getType, isDeleted, isNew } from './helpers'
import { toISODate } from 'shared/helpers/date'

type OperatorType = 'AND' | 'OR'

type ConditionRule =
  | number
  | string
  | boolean
  | null
  | {
      is?: number | string | string[]
      contains?: string | string[]
      in?: [number, number]
      '>'?: number
      '>='?: number
      '<'?: number
      '<='?: number
    }

type DefaultConditions = {
  [key in keyof TTransaction]?: ConditionRule
}

type CustomConditions = {
  search?: null | string
  type?: null | TrType
  showDeleted?: boolean
  isNew?: boolean
  dateFrom?: null | TDateDraft
  dateTo?: null | TDateDraft
  tags?: null | TTagId[]
  mainTags?: null | TTagId[]
  accountsFrom?: null | TAccountId[]
  accountsTo?: null | TAccountId[]
  accounts?: null | TAccountId[]
  amountFrom?: null | number
  amountTo?: null | number
}

export type FilterConditions = DefaultConditions & CustomConditions

export const checkRaw =
  (
    conditions: FilterConditions | FilterConditions[] = {},
    operator: OperatorType = 'OR'
  ) =>
  (tr: TTransaction) => {
    if (Array.isArray(conditions)) {
      const results = conditions.map(cond => checkConditions(tr, cond))
      return operator === 'AND' ? results.every(Boolean) : results.some(Boolean)
    }
    return checkConditions(tr, conditions)
  }

const checkConditions = (tr: TTransaction, conditions: FilterConditions) => {
  return (
    // Always check is transaction deleted or not (usually we don't want deleted transactions)
    checkDeleted(tr, conditions.showDeleted) &&
    keys(conditions)
      .map(field => {
        switch (field) {
          case 'search':
            return checkSearch(tr, conditions[field])
          case 'type':
            return checkType(tr, conditions.type)
          case 'showDeleted':
            return checkDeleted(tr, conditions.showDeleted)
          case 'isNew':
            return checkIsNew(tr, conditions.isNew)
          case 'dateFrom':
          case 'dateTo':
            return checkDate(tr, conditions.dateFrom, conditions.dateTo)
          case 'tags':
            return checkTags(tr, conditions.tags, 'any')
          case 'mainTags':
            return checkTags(tr, conditions.mainTags, 'main')
          case 'accountsFrom':
          case 'accountsTo':
            return checkAccounts(
              tr,
              conditions.accountsFrom,
              conditions.accountsTo
            )
          case 'accounts':
            return (
              checkAccounts(tr, undefined, conditions.accounts) ||
              checkAccounts(tr, conditions.accounts)
            )
          case 'amountFrom':
            return checkAmount(tr, conditions.amountFrom, 'greaterOrEqual')
          case 'amountTo':
            return checkAmount(tr, conditions.amountTo, 'lessOrEqual')

          default:
            if (field in tr) {
              return checkRule(tr[field], conditions[field])
            } else {
              throw new Error('Unknown filtering field: ' + field)
            }
        }
      })
      .every(Boolean)
  )
}

const checkRule = (value: any, rule?: ConditionRule) => {
  if (rule === undefined) {
    return true
  }
  if (
    typeof rule === 'number' ||
    typeof rule === 'string' ||
    typeof rule === 'boolean' ||
    rule === null
  ) {
    return value === rule
  }

  if (rule['is'] !== undefined) {
    // TODO Arrray check
    if (rule.is !== value) return false
  }
  if (rule['contains'] !== undefined) {
    // TODO
    return false
  }
  if (rule['in'] !== undefined) {
    if (rule.in[0] > value || rule.in[1] < value) return false
  }
  if (rule['>'] !== undefined) {
    if (!(value > rule['>'])) return false
  }
  if (rule['>='] !== undefined) {
    if (!(value >= rule['>='])) return false
  }
  if (rule['<'] !== undefined) {
    if (!(value < rule['<'])) return false
  }
  if (rule['<='] !== undefined) {
    if (!(value <= rule['<='])) return false
  }
  return true
}

const checkSearch = (tr: TTransaction, search?: FilterConditions['search']) => {
  if (!search) return true
  if (tr.comment?.toUpperCase().includes(search.toUpperCase())) return true
  if (tr.payee?.toUpperCase().includes(search.toUpperCase())) return true
  return false
}

const checkType = (tr: TTransaction, type?: FilterConditions['type']) =>
  !type || getType(tr) === type

const checkDeleted = (
  tr: TTransaction,
  showDeleted?: FilterConditions['showDeleted']
) => showDeleted || !isDeleted(tr)

const checkDate = (
  tr: TTransaction,
  dateFrom?: FilterConditions['dateFrom'],
  dateTo?: FilterConditions['dateTo']
) => {
  if (dateFrom && tr.date < toISODate(dateFrom)) return false
  if (dateTo && tr.date > toISODate(dateTo)) return false
  return true
}

const checkAccounts = (
  tr: TTransaction,
  accountsFrom?: FilterConditions['accountsFrom'],
  accountsTo?: FilterConditions['accountsTo']
) => {
  const check = (current: TAccountId, need?: null | TAccountId[]) =>
    need ? need.includes(current) : true
  return (
    check(tr.incomeAccount, accountsTo) &&
    check(tr.outcomeAccount, accountsFrom)
  )
}

const checkTags = (
  tr: TTransaction,
  tags?: FilterConditions['mainTags'],
  matchType: 'main' | 'any' = 'any'
) => {
  if (!tags || !tags.length) return true
  if (getType(tr) === 'transfer') return false
  if (!tr.tag) return tags.includes('null')

  if (matchType === 'main') return tags.includes(tr.tag[0])
  return tr.tag.some(id => tags.includes(id))
}

const checkAmount = (
  tr: TTransaction,
  amount?: FilterConditions['amountFrom'],
  compareType: 'greaterOrEqual' | 'lessOrEqual' = 'lessOrEqual'
) => {
  if (!amount) return true
  const trAmount = getType(tr) === 'income' ? tr.income : tr.outcome
  return compareType === 'lessOrEqual' ? trAmount <= amount : trAmount >= amount
}

const checkIsNew = (
  tr: TTransaction,
  condition?: FilterConditions['isNew']
) => {
  if (condition === undefined) return true
  const isNewTransaction = isNew(tr)
  return isNewTransaction === condition
}
