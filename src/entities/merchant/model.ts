import { RootState } from '@store'

export const getMerchants = (state: RootState) => state.data.current.merchant
