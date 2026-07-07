import { addFxAmount } from '6-shared/helpers/money'
import type { ById, TFxAmount } from '6-shared/types'
import type {
  TAccount,
  TAccountId,
  TFxCode,
  TInstrumentId,
} from '../../zenmoney'

export function buildCurrentFunds(input: {
  accounts: ById<TAccount>
  inBudgetIds: TAccountId[]
  instrumentCodeById: Record<TInstrumentId, TFxCode>
}): TFxAmount {
  const { accounts, inBudgetIds, instrumentCodeById } = input
  return addFxAmount(
    ...inBudgetIds.map(id => {
      const account = accounts[id]
      return { [instrumentCodeById[account.instrument]]: account.balance }
    })
  )
}
