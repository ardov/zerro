import { TEnvConditions } from '4-features/envelope/envelopeFiltering'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'

export function useTrDrawer() {
  const transactionDrawer = useTransactionDrawer()
  const open = (envelopeConditions: TEnvConditions) => {
    transactionDrawer.open({ envelopeConditions })
  }
  return open
}
