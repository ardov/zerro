import { getUserCurrencyCode } from 'models/instrument'
import { useAppSelector } from 'store'

export const useDisplayCurrency = () => {
  return useAppSelector(getUserCurrencyCode)
}
