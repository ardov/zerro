import { createSelector } from '@reduxjs/toolkit'
import { TAccountId } from 'models/account'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { getReminders, TReminder, TReminderId } from 'models/reminder'
import { TTagId } from 'models/tag'
import { TISODate } from 'shared/types'
import { parseComment, getRecordId } from './helpers'
import {
  TRecord,
  RecordType,
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

export const getRawHiddenData = createSelector([getReminders], parseReminders)
export const getBudgets = createSelector(
  [getRawHiddenData],
  data => data.budgets
)
export const getDataReminders = createSelector(
  [getRawHiddenData],
  data => data.dataReminders
)

function parseReminders(
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
      case RecordType.Goals:
        res.goals[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case RecordType.FxRates:
        res.fxRates[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case RecordType.Budgets:
        res.budgets[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case RecordType.LinkedAccounts:
        res.linkedAccounts = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case RecordType.LinkedDebtors:
        res.linkedDebtors = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case RecordType.TagMeta:
        res.tagMeta = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case RecordType.TagOrder:
        res.tagOrder = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
    }
  })

  return res
}
