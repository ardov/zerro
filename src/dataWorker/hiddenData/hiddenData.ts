import { TAccountId, TGoal, TTagId, TFxCode, TReminder, TTagMeta } from 'types'
import { TRecord, recordType } from './record-types'

// const $dataReminderList = combine(
//   {
//     dataAccId: $dataAccountId,
//     reminders: $reminders,
//   },
//   ({ dataAccId, reminders }) => {
//     if (!dataAccId) return [] as TReminder[]
//     return Object.values(reminders).filter(
//       reminder =>
//         parseComment(reminder.comment) &&
//         (reminder.incomeAccount === dataAccId ||
//           reminder.outcomeAccount === dataAccId)
//     )
//   }
// )

// const $parsedData = $dataReminderList.map(aggregateHiddenData)
// export const $goals = $parsedData.map(s => s.goals)
// export const $fxRates = $parsedData.map(s => s.fxRates)
// export const $budgets = $parsedData.map(s => s.budgets)
// export const $linkedAccounts = $parsedData.map(s => s.linkedAccounts)
// export const $linkedDebtors = $parsedData.map(s => s.linkedDebtors)
// export const $tagMeta = $parsedData.map(s => s.tagMeta)
// export const $tagOrder = $parsedData.map(s => s.tagOrder)
// export const $dataReminders = $parsedData.map(s => s.dataReminders)

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

type TAggregatedResult = {
  goals: { [month: string]: { [id: TTagId]: TGoal } }
  fxRates: { [month: string]: { [id: TFxCode]: number } }
  budgets: { [month: string]: { [id: TTagId]: number } }
  linkedAccounts: { [id: TAccountId]: TTagId }
  linkedDebtors: { [id: string]: TTagId }
  tagMeta: { [id: TTagId]: TTagMeta }
  // tagOrder: TTagTree
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
    // tagOrder: [],
    dataReminders: {},
  }

  reminders.forEach(reminder => {
    const rec = parseComment(reminder.comment) as TRecord
    if (!rec) return
    switch (rec.type) {
      case recordType.goals:
        // res.goals[rec.date] = rec.payload
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
        // res.tagMeta = rec.payload
        res.dataReminders[getRecordId(rec.type)] = reminder
        break
      case recordType.tagOrder:
        // res.tagOrder = rec.payload
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
