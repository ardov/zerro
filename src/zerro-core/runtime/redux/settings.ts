export { setEmojiIcons, setPreferZmBudgets } from './commands'
import { useAppSelector } from '@/store'
import { fromGraph, graph } from './graph'

export const select = fromGraph(graph.userSettings)
export const use = () => useAppSelector(select)
