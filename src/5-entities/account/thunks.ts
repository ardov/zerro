import { AppThunk } from 'store'
import { sendEvent } from '6-shared/helpers/tracking'
import { TAccountId } from '6-shared/types'
import { setAccountInBalance } from 'core-next/adapters/redux'

export const setInBudget =
  (id: TAccountId, inBalance: boolean): AppThunk =>
  dispatch => {
    sendEvent(`Accounts: Set in budget`)
    dispatch(setAccountInBalance(id, !!inBalance))
  }
