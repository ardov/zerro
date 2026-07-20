import type { RootState } from 'store'
import { graph } from './graph'
import * as monthList from './monthList'

export const selectList = monthList.selectList
export const selectTotals = (state: RootState) =>
  graph.monthTotals(state.data.current)
