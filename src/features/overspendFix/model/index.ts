import { fixOverspends } from './fixOverspends'
import { getOverspendsByMonth } from './getOverspends'

export const overspendModel = {
  get: getOverspendsByMonth,
  fixAll: fixOverspends,
}
