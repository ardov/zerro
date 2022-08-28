import { useAppSelector } from 'store'
import { getUserCurrencyCode } from './model'

export const useDisplayCurrency = () => {
  return useAppSelector(getUserCurrencyCode)
}
