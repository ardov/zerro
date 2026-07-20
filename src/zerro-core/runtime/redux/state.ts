import type { RootState } from 'store'

/** Redux integration seam: the only selector that knows where Core data lives. */
export const selectData = (state: RootState) => state.data.current
