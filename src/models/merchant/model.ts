import { RootState } from 'models'

export const getMerchants = (state: RootState) => state.data.current.merchant
