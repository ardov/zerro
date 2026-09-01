import type { RootState } from '@/store'
import { selectDisplayedData } from '@/store/history'

/** Redux integration seam: the only selector that knows where Core data lives. */
export const selectData = (
  state: RootState,
  mode: 'displayed' | 'live' = 'displayed'
) => (mode === 'live' ? state.data.current : selectDisplayedData(state))
