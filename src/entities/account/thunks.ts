import { getAccounts } from './index'
import { AppThunk } from '@store'
import { sendEvent } from '@shared/helpers/tracking'
import { IAccount, OptionalExceptFor, TAccountId } from '@shared/types'
import { applyClientPatch } from '@store/data'

export type TAccountDraft = OptionalExceptFor<IAccount, 'id'>

export const patchAccount =
  (draft: TAccountDraft): AppThunk<IAccount> =>
  (dispatch, getState): IAccount => {
    if (!draft.id) throw new Error('Trying to patch account without id')
    let current = getAccounts(getState())[draft.id]
    if (!current) throw new Error('Account not found')
    const patched = { ...current, ...draft, changed: Date.now() }

    sendEvent('Account: edit')
    dispatch(applyClientPatch({ account: [patched] }))
    return patched
  }

export const setInBudget =
  (id: TAccountId, inBalance: boolean): AppThunk =>
  (dispatch, getState) => {
    sendEvent(`Accounts: Set in budget`)
    dispatch(patchAccount({ id, inBalance: !!inBalance }))
  }
