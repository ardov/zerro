import { TCompany, TZmCompany } from 'shared/types'
import { msToUnix, TZmAdapter, zmDateToMs } from 'shared/helpers/adapterUtils'

export const convertCompany: TZmAdapter<TZmCompany, TCompany> = {
  toClient: el => {
    return { ...el, changed: zmDateToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
