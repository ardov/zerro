import { combine } from 'effector'
import {
  AccountId,
  Goal,
  TagId,
  TFxCode,
  TReminder,
  TTagMetaData,
  TTagTree,
} from '../../types'
import { $reminders } from '../reminders'
import { $dataAccountId } from './dataAccountId'
import { TRecord } from './record-types'

const $dataReminderList = combine(
  {
    dataAccId: $dataAccountId,
    reminders: $reminders,
  },
  ({ dataAccId, reminders }) => {
    if (!dataAccId) return [] as TReminder[]
    return Object.values(reminders).filter(
      reminder =>
        parseComment(reminder.comment) &&
        (reminder.incomeAccount === dataAccId ||
          reminder.outcomeAccount === dataAccId)
    )
  }
)

const $parsedData = $dataReminderList.map(aggregateHiddenData)
export const $goals = $parsedData.map(s => s.goals)
export const $fxRates = $parsedData.map(s => s.fxRates)
export const $budgets = $parsedData.map(s => s.budgets)
export const $linkedAccounts = $parsedData.map(s => s.linkedAccounts)
export const $linkedDebtors = $parsedData.map(s => s.linkedDebtors)
export const $tagMeta = $parsedData.map(s => s.tagMeta)
export const $tagOrder = $parsedData.map(s => s.tagOrder)
export const $dataReminders = $parsedData.map(s => s.dataReminders)

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

type TAggregatedResult = {
  goals: { [month: string]: { [id: TagId]: Goal } }
  fxRates: { [month: string]: { [id: TFxCode]: number } }
  budgets: { [month: string]: { [id: TagId]: number } }
  linkedAccounts: { [id: AccountId]: TagId }
  linkedDebtors: { [id: string]: TagId }
  tagMeta: { [id: TagId]: TTagMetaData }
  tagOrder: TTagTree
  dataReminders: { [dataId: string]: TReminder }
}

function aggregateHiddenData(reminders: TReminder[]): TAggregatedResult {
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

  reminders.forEach(reminder => {
    const rec = parseComment(reminder.comment) as TRecord
    if (!rec) return
    switch (rec.type) {
      case 'goals':
        res.goals[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case 'fxRates':
        res.fxRates[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case 'budgets':
        res.budgets[rec.date] = rec.payload
        res.dataReminders[getRecordId(rec.type, rec.date)] = reminder
        break
      case 'linkedAccounts':
        res.linkedAccounts = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case 'linkedDebtors':
        res.linkedDebtors = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case 'tagMeta':
        res.tagMeta = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case 'tagOrder':
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

function getRecordId(type: string, date?: string) {
  return date ? `${type}-${date}` : type
}
