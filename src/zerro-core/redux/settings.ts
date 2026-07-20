export { setEmojiIcons, setPreferZmBudgets } from './commands'
import { useAppSelector } from 'store'
import type { RootState } from 'store'
import { graph } from './graph'

export const select = (state: RootState) =>
  graph.userSettings(state.data.current)
export const use = () => useAppSelector(select)
