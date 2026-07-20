import { addFxAmount } from '../../zenmoney/model/money'
import type { ById } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TAccount, TAccountId } from '../../zenmoney/entities/accounts'
import type {
  TFxCode,
  TInstrumentId,
} from '../../zenmoney/entities/instruments'

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
