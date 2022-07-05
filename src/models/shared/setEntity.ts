import {
  TAccount,
  TBudget,
  TCompany,
  TCountry,
  DataEntity,
  TInstrument,
  TMerchant,
  TReminder,
  TReminderMarker,
  TTag,
  TTransaction,
  TUser,
} from 'shared/types'

// prettier-ignore
export type TEntities = {
  [DataEntity.Instrument]:      TInstrument
  [DataEntity.Country]:         TCountry
  [DataEntity.Company]:         TCompany
  [DataEntity.User]:            TUser
  [DataEntity.Merchant]:        TMerchant
  [DataEntity.Account]:         TAccount
  [DataEntity.Tag]:             TTag
  [DataEntity.Budget]:          TBudget
  [DataEntity.Reminder]:        TReminder
  [DataEntity.ReminderMarker]:  TReminderMarker
  [DataEntity.Transaction]:     TTransaction
}

export function createEntitySetter(entityType: DataEntity) {
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
