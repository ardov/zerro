import { TAccountId } from 'models/account'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TReminder, TReminderId } from 'models/reminder'
import { TTagId } from 'models/tag'
import { TISODate } from 'shared/types'
import {
  TRecord,
  recordType,
  TBudget,
  TTagMetaData,
  TTagTree,
  TGoal,
} from './types'

export type TAggregatedResult = {
  fxRates: { [month: TISODate]: Record<TFxCode, number> }
  goals: {
    [month: TISODate]: {
      tags?: Record<TTagId, TGoal>
      accounts?: Record<TAccountId, TGoal>
      merchants?: Record<TMerchantId, TGoal>
    }
  }
  budgets: {
    [month: TISODate]: {
      tags?: Record<TTagId, TBudget>
      accounts?: Record<TAccountId, TBudget>
      merchants?: Record<TMerchantId, TBudget>
    }
  }
  linkedAccounts: Record<TAccountId, TTagId>
  linkedDebtors: Record<TMerchantId, TTagId>
  tagMeta: Record<TTagId, TTagMetaData>
  tagOrder: TTagTree
  dataReminders: { [dataId: string]: TReminder }
}

export function parseReminders(
  reminders: Record<TReminderId, TReminder>
): TAggregatedResult {
  let res: TAggregatedResult = {
    goals: {},
    fxRates: {},
    budgets: {},
    linkedAccounts: {},
    linkedDebtors: {},
    tagMeta: {},
    tagOrder: [],
    dataReminders: {},
  }

  Object.values(reminders).forEach(reminder => {
    const rec = parseComment(reminder.comment) as TRecord
    if (!rec) return
    switch (rec.type) {
      case recordType.goals:
        res.goals[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case recordType.fxRates:
        res.fxRates[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case recordType.budgets:
        res.budgets[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case recordType.linkedAccounts:
        res.linkedAccounts = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case recordType.linkedDebtors:
        res.linkedDebtors = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case recordType.tagMeta:
        res.tagMeta = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case recordType.tagOrder:
        res.tagOrder = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
    }
  })

  return res
}

function parseComment(comment: string | null) {
  if (!comment) return null
  try {
    return JSON.parse(comment)
  } catch {
    return null
  }
}

function getRecordId(type: recordType, date?: TISODate) {
  return date ? `${type}#${date}` : type
}
