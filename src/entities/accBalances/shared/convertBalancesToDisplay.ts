import { TDateDraft, TFxAmount } from '@shared/types'
import { entries } from '@shared/helpers/keys'
import { TBalanceNode } from './types'

export function balancesToDisplay(
  list: Array<TBalanceNode<TFxAmount>>,
  convert: (v: TFxAmount, date: TDateDraft) => number
): Array<TBalanceNode<number>> {
  return list.map(convertNode)

  function convertNode(node: TBalanceNode<TFxAmount>): TBalanceNode<number> {
    let displayNode: TBalanceNode<number> = {
      date: node.date,
      balances: { accounts: {}, debtors: {} },
    }
    // Add accounts
    entries(node.balances.accounts).forEach(([id, amount]) => {
      displayNode.balances.accounts[id] = convert(amount, node.date)
    })
    // Add debtors
    entries(node.balances.debtors).forEach(([id, amount]) => {
      displayNode.balances.debtors[id] = convert(amount, node.date)
    })
    return displayNode
  }
}
