import { DataEntity, TAccountId, TTransaction } from '@shared/types'
import { add } from '@shared/helpers/money'

import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { accountModel } from '@entities/account'
import { trModel } from '@entities/transaction'
import { userModel } from '@entities/user'

/**
 * Deletes account and moves all the transactions to another one
 * @param source account to be deleted
 * @param target account where transactions will move (must have the same currency)
 * @returns
 */
export const mergeAccounts =
  (source: TAccountId, target: TAccountId): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const accounts = accountModel.getAccounts(state)
    const transactions = trModel.getTransactionsHistory(state)
    const user = userModel.getRootUser(state)
    const changes: TTransaction[] = []

    const sourceAcc = accounts[source]
    const targetAcc = accounts[target]

    if (!user) {
      throw new Error('No user')
    }
    if (sourceAcc.instrument !== targetAcc.instrument) {
      throw new Error('Currency should be the same')
    }

    let targetBalanceChg = sourceAcc.startBalance

    transactions.forEach(tr => {
      // Transfer target <-> source
      if (
        (tr.outcomeAccount === target && tr.incomeAccount === source) ||
        (tr.outcomeAccount === source && tr.incomeAccount === target)
      ) {
        targetBalanceChg = add(targetBalanceChg, tr.income, -tr.outcome)
        changes.push({ ...tr, deleted: true, changed: Date.now() })
        return
      }

      // All other transactions
      if (tr.incomeAccount === source || tr.outcomeAccount === source) {
        changes.push({
          ...tr,
          incomeAccount:
            tr.incomeAccount === source ? target : tr.incomeAccount,
          outcomeAccount:
            tr.outcomeAccount === source ? target : tr.outcomeAccount,
          changed: Date.now(),
        })
        return
      }
    })

    dispatch(
      applyClientPatch({
        transaction: changes,
        account: [
          {
            ...targetAcc,
            startBalance: add(targetBalanceChg, targetAcc.startBalance),
            balance: add(sourceAcc.balance, targetAcc.balance),
            changed: Date.now(),
          },
        ],
        deletion: [
          {
            id: source,
            object: DataEntity.Account,
            stamp: Date.now(),
            user: user.id,
          },
        ],
      })
    )
  }
