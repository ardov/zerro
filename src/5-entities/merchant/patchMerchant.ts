import { sendEvent } from '6-shared/helpers/tracking'
import { OptionalExceptFor, TMerchant } from '6-shared/types'
import { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'
import { getMerchants } from './model'

export type TMerchantDraft = OptionalExceptFor<TMerchant, 'id'>

export const patchMerchant =
  (draft: TMerchantDraft | TMerchantDraft[]): AppThunk<TMerchant[]> =>
  (dispatch, getState) => {
    const patched: TMerchant[] = []
    let list = Array.isArray(draft) ? draft : [draft]

    list.forEach(draft => {
      if (!draft.id) throw new Error('Trying to patch tag without id')
      let current = getMerchants(getState())[draft.id]
      if (!current) throw new Error('Merchant not found')
      patched.push({ ...current, ...draft, changed: Date.now() })
    })

    sendEvent('Merchant: edit')
    dispatch(applyClientPatch({ merchant: patched }))
    return patched
  }
