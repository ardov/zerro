import { AppThunk } from 'store'
import { getEnvelopeId } from 'models/shared/envelopeHelpers'
import { toISODate } from 'shared/helpers/date'
import {
  DataEntity,
  TAccountId,
  TDateDraft,
  TFxCode,
  TMerchantId,
  TTagId,
} from 'shared/types'
import { getRawHiddenData } from './parseReminders'
import { setHiddenDataPiece } from './setDataReminder'
import { RecordType, TRecordBudgets } from './types'

type TBudgetDraft = {
  date: TDateDraft
  type: DataEntity.Tag | DataEntity.Account | DataEntity.Merchant
  id: TTagId | TAccountId | TMerchantId
  value: number
  fx: TFxCode
}

export function setBudget(draft: TBudgetDraft): AppThunk {
  return (dispatch, getState) => {
    const dateISO = toISODate(draft.date)
    const currentData =
      getRawHiddenData(getState())[RecordType.Budgets][dateISO] ||
      ({} as TRecordBudgets['payload'])

    const envelopeId = getEnvelopeId(draft.type, draft.id)
    const newData: TRecordBudgets['payload'] = { ...currentData }
    if (draft.value) newData[envelopeId] = { value: draft.value, fx: draft.fx }
    else delete newData[envelopeId]

    dispatch(
      setHiddenDataPiece({
        type: RecordType.Budgets,
        date: dateISO,
        payload: newData,
      })
    )
    console.log('🎉 currentData', getRawHiddenData(getState()))
  }
}
