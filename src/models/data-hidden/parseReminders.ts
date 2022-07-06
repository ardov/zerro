import { createSelector } from '@reduxjs/toolkit'
import { getReminders } from 'models/reminder'
import { IReminder, TReminderId } from 'shared/types'
import { parseComment, getRecordId } from './helpers'
import {
  TRecord,
  RecordType,
  TRecordBudgets,
  TRecordFxRates,
  TRecordGoals,
  TRecordLinkedAccounts,
  TRecordLinkedMerchants,
  TRecordTagMeta,
  TRecordTagOrder,
} from './types'

export type TAggregatedResult = {
  [RecordType.Budgets]: Record<
    TRecordBudgets['date'],
    TRecordBudgets['payload']
  >
  [RecordType.FxRates]: Record<
    TRecordFxRates['date'],
    TRecordFxRates['payload']
  >
  [RecordType.Goals]: Record<TRecordGoals['date'], TRecordGoals['payload']>
  [RecordType.LinkedAccounts]: TRecordLinkedAccounts['payload']
  [RecordType.LinkedDebtors]: TRecordLinkedMerchants['payload']
  [RecordType.TagMeta]: TRecordTagMeta['payload']
  [RecordType.TagOrder]: TRecordTagOrder['payload']
  dataReminders: { [dataId: string]: IReminder }
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
  reminders: Record<TReminderId, IReminder>
): TAggregatedResult {
  let res: TAggregatedResult = {
    [RecordType.Goals]: {},
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
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.FxRates:
        res.fxRates[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.Budgets:
        res.budgets[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.LinkedAccounts:
        res.linkedAccounts = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.LinkedDebtors:
        res.linkedDebtors = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.TagMeta:
        res.tagMeta = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
      case RecordType.TagOrder:
        res.tagOrder = rec.payload
        res.dataReminders[getRecordId(rec)] = reminder
        break
    }
  })

  return res
}
