import type { RootState } from 'store'
import { graph } from './graph'

export const selectAll = (state: RootState) => graph.debtors(state.data.current)
