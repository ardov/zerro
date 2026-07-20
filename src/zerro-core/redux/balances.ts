import type { RootState } from 'store'
import { graph } from './graph'

export const selectAll = (state: RootState) =>
  graph.balances(state.data.current)
export const selectByDate = (state: RootState) =>
  graph.balancesByDate(state.data.current)
