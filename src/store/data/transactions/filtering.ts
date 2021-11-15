import { AccountId, TagId, Transaction, TransactionType } from 'types'
import { keys } from 'helpers/keys'
import { getType, isDeleted, isNew } from './helpers'

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
  [key in keyof Transaction]?: ConditionRule
}

type CustomConditions = {
  search?: null | string
  type?: null | TransactionType
  showDeleted?: boolean
  isNew?: boolean
  dateFrom?: null | number | Date
  dateTo?: null | number | Date
  tags?: null | TagId[]
  accountsFrom?: null | AccountId[]
  accountsTo?: null | AccountId[]
  accounts?: null | AccountId[]
  amountFrom?: null | number
  amountTo?: null | number
}

export type FilterConditions = DefaultConditions & CustomConditions

export const checkRaw = (
  conditions: FilterConditions | FilterConditions[] = {},
  operator: OperatorType = 'OR'
) => (tr: Transaction) => {
  if (Array.isArray(conditions)) {
    const results = conditions.map(cond => checkConditions(tr, cond))
    return operator === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }
  return checkConditions(tr, conditions)
}

const checkConditions = (tr: Transaction, conditions: FilterConditions) => {
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
            return checkTags(tr, conditions.tags)
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

const checkSearch = (tr: Transaction, search?: FilterConditions['search']) => {
  if (!search) return true
  if (tr.comment?.toUpperCase().includes(search.toUpperCase())) return true
  if (tr.payee?.toUpperCase().includes(search.toUpperCase())) return true
  return false
}

const checkType = (tr: Transaction, type?: FilterConditions['type']) =>
  !type || getType(tr) === type

const checkDeleted = (
  tr: Transaction,
  showDeleted?: FilterConditions['showDeleted']
) => showDeleted || !isDeleted(tr)

const checkDate = (
  tr: Transaction,
  dateFrom?: FilterConditions['dateFrom'],
  dateTo?: FilterConditions['dateTo']
) => (!dateFrom || +tr.date >= +dateFrom) && (!dateTo || +tr.date <= +dateTo)

const checkAccounts = (
  tr: Transaction,
  accountsFrom?: FilterConditions['accountsFrom'],
  accountsTo?: FilterConditions['accountsTo']
) => {
  const check = (current: AccountId, need?: null | AccountId[]) =>
    need ? need.includes(current) : true
  return (
    check(tr.incomeAccount, accountsTo) &&
    check(tr.outcomeAccount, accountsFrom)
  )
}

const checkTags = (tr: Transaction, tags?: FilterConditions['tags']) => {
  if (!tags || !tags.length) return true
  if (!tr.tag && tags.includes('null') && getType(tr) !== 'transfer')
    return true
  if (!tr.tag) return false
  let result = false
  tr.tag.forEach(id => {
    if (tags.includes(id)) result = true
  })
  return result
}

const checkAmount = (
  tr: Transaction,
  amount?: FilterConditions['amountFrom'],
  compareType: 'greaterOrEqual' | 'lessOrEqual' = 'lessOrEqual'
) => {
  if (!amount) return true
  const trAmount = getType(tr) === 'income' ? tr.income : tr.outcome
  return compareType === 'lessOrEqual' ? trAmount <= amount : trAmount >= amount
}

const checkIsNew = (tr: Transaction, condition?: FilterConditions['isNew']) => {
  if (condition === undefined) return true
  const isNewTransaction = isNew(tr)
  return isNewTransaction === condition
}
