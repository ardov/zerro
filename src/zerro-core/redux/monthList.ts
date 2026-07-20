import type { RootState } from 'store'
import { graph } from './graph'

export const selectList = (state: RootState) =>
  graph.monthList(state.data.current)
