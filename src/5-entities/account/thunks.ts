import { AppThunk } from 'store'
import { sendEvent } from '6-shared/helpers/tracking'
import { TAccount, OptionalExceptFor, TAccountId } from '6-shared/types'
import { applyClientPatch } from 'store/data'
import { getAccounts } from './selectors'

export type TAccountPatch = OptionalExceptFor<TAccount, 'id'>

export const patchAccount =
  (patch: TAccountPatch | TAccountPatch[]): AppThunk<TAccount[]> =>
  (dispatch, getState) => {
    const patched: TAccount[] = []
    let list = Array.isArray(patch) ? patch : [patch]

    list.forEach(patch => {
      if (!patch.id) throw new Error('Trying to patch account without id')
      let current = getAccounts(getState())[patch.id]
      if (!current) throw new Error('Account not found')
      patched.push({ ...current, ...patch, changed: Date.now() })
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
