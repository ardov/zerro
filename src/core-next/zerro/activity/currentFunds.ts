import { addFxAmount } from '../../shared/money'
import type { ById } from '../../shared/types'
import type { TFxAmount } from '../../shared/money'
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
