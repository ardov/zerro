import { TAccount } from 'models/account'
import { TBudget } from 'models/budget'
import { TCompany } from 'models/company'
import { TCountry } from 'models/country'
import { EntityType } from 'models/deletion'
import { TInstrument } from 'models/instrument'
import { TMerchant } from 'models/merchant'
import { TReminder } from 'models/reminder'
import { TReminderMarker } from 'models/reminderMarker'
import { TTag } from 'models/tag'
import { TTransaction } from 'models/transaction'
import { TUser } from 'models/user'

// prettier-ignore
export type TEntities = {
  [EntityType.Instrument]:      TInstrument
  [EntityType.Country]:         TCountry
  [EntityType.Company]:         TCompany
  [EntityType.User]:            TUser
  [EntityType.Merchant]:        TMerchant
  [EntityType.Account]:         TAccount
  [EntityType.Tag]:             TTag
  [EntityType.Budget]:          TBudget
  [EntityType.Reminder]:        TReminder
  [EntityType.ReminderMarker]:  TReminderMarker
  [EntityType.Transaction]:     TTransaction
}

export function createEntitySetter(entityType: EntityType) {
  return (entity: any) => ({
    type: `SET_${entityType}`,
    payload: entity,
  })
}

// export const  setHiddenData =
//   (data: any, type: RecordType, date?: TISODate): AppThunk =>
//   (dispatch, getState) => {
//     dispatch(prepareDataAccount)

//     const state = getState()
//     const user = getRootUser(state)?.id
//     if (!user) return
//     const reminders = getDataReminders(state)
//     const recordId = getRecordId(type, date)
//     const updatedData = { type, date, data }
//     const comment = JSON.stringify(updatedData)
//     if (reminders[recordId]) {
//       // Update existing reminder
//       dispatch(
//         setReminder({
//           id: reminders[recordId].id,
//           comment,
//         })
//       )
//     } else {
//       // Create new reminder
//       const dataAcc = getDataAccountId(state)
//       if (!dataAcc) return
//       dispatch(
//         setReminder({
//           incomeAccount: dataAcc,
//           outcomeAccount: dataAcc,
//           income: 1,
//           startDate: '2020-01-01',
//           endDate: '2020-01-01',
//           comment,
//         })
//       )
//     }
//   }
