import { DataEntity } from 'shared/types'

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
