import { sendEvent } from '6-shared/helpers/tracking'
import { OptionalExceptFor, TMerchant } from '6-shared/types'
import { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'
import { getMerchants } from './model'

export type TMerchantPatch = OptionalExceptFor<TMerchant, 'id'>

export const patchMerchant =
  (patch: TMerchantPatch | TMerchantPatch[]): AppThunk<TMerchant[]> =>
  (dispatch, getState) => {
    const patched: TMerchant[] = []
    let list = Array.isArray(patch) ? patch : [patch]

    list.forEach(patch => {
      if (!patch.id) throw new Error('Trying to patch tag without id')
      let current = getMerchants(getState())[patch.id]
      if (!current) throw new Error('Merchant not found')
      patched.push({ ...current, ...patch, changed: Date.now() })
    })

    sendEvent('Merchant: edit')
    dispatch(applyClientPatch({ merchant: patched }))
    return patched
  }
