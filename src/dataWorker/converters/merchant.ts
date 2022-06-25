import { TMerchant, TZmMerchant } from 'shared/types'
import { msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertMerchant: TZmAdapter<TZmMerchant, TMerchant> = {
  toClient: el => {
    return { ...el, changed: zmDateToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
