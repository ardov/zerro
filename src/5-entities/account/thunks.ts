import { AppThunk } from 'store'
import { sendEvent } from '6-shared/helpers/tracking'
import { TAccount, OptionalExceptFor, TAccountId } from '6-shared/types'
import { applyClientPatch } from 'store/data'
import { getAccounts } from './selectors'

export type TAccountDraft = OptionalExceptFor<TAccount, 'id'>

export const patchAccount =
  (draft: TAccountDraft | TAccountDraft[]): AppThunk<TAccount[]> =>
  (dispatch, getState) => {
    const patched: TAccount[] = []
    let list = Array.isArray(draft) ? draft : [draft]

    list.forEach(draft => {
      if (!draft.id) throw new Error('Trying to patch account without id')
      let current = getAccounts(getState())[draft.id]
      if (!current) throw new Error('Account not found')
      patched.push({ ...current, ...draft, changed: Date.now() })
    })

    sendEvent('Account: edit')
    dispatch(applyClientPatch({ account: patched }))
    return patched
  }

export const setInBudget =
  (id: TAccountId, inBalance: boolean): AppThunk =>
  (dispatch, getState) => {
    sendEvent(`Accounts: Set in budget`)
    dispatch(patchAccount({ id, inBalance: !!inBalance }))
  }
