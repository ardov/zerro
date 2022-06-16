import { TCompany, TZmCompany } from 'types'
import { msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertCompany: TZmAdapter<TZmCompany, TCompany> = {
  toClient: el => {
    return { ...el, changed: zmDateToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
