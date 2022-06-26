import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { TCompany, TZmCompany } from 'shared/types'

export const convertCompany: TZmAdapter<TZmCompany, TCompany> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
