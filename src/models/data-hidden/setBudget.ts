import { AppThunk } from 'models'
import { TAccountId } from 'models/account'
import { EntityType } from 'models/deletion'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TTagId } from 'models/tag'
import { setHiddenDataPiece } from './setDataReminder'

type TBudgetDraft = {
  target: EntityType.Tag | EntityType.Account | EntityType.Merchant
  id: TTagId | TAccountId | TMerchantId
  value: number
  fx: TFxCode
}

export function setBudget(draft: TBudgetDraft): AppThunk {
  return (dispatch, getState) => {
    // dispatch(setHiddenDataPiece())

    const state = getState()
  }
}
