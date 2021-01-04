import { createSelector } from '@reduxjs/toolkit'
import { round } from 'helpers/currencyHelpers'
import { getTime, getType } from 'store/localData/transactions/helpers'
import { getAccounts, getDebtAccountId } from 'store/localData/accounts'
import { getTransactionsHistory } from 'store/localData/transactions'
import { Transaction } from 'types'

interface Node {
  date: number
  totalChange: number
  change: number
  transaction: Transaction
}
interface ChangesByAccount {
  [accId: string]: Node[]
}
interface ChangesByDebtor {
  [debtor: string]: {
    [instrument: string]: Node[]
  }
}

export const getBalanceChanges = createSelector(
  [getTransactionsHistory, getDebtAccountId],
  (transactions, debtId) => {
    const byAccount: ChangesByAccount = {}
    const byMerchant: ChangesByDebtor = {}
    const byPayee: ChangesByDebtor = {}

    transactions.forEach(transaction => {
      const {
        income,
        outcome,
        merchant,
        payee,
        incomeAccount,
        outcomeAccount,
        incomeInstrument,
        outcomeInstrument,
      } = transaction
      const type = getType(transaction, debtId)
      const date = +getTime(transaction)

      if (type === 'income') {
        addToAccount(income, incomeAccount)
      }
      if (type === 'outcome') {
        addToAccount(-outcome, outcomeAccount)
      }
      if (type === 'transfer') {
        addToAccount(income, incomeAccount)
        addToAccount(-outcome, outcomeAccount)
      }
      if (type === 'incomeDebt') {
        addToAccount(income, incomeAccount)
        addDebt(-outcome, outcomeInstrument)
      }
      if (type === 'outcomeDebt') {
        addDebt(income, incomeInstrument)
        addToAccount(-outcome, outcomeAccount)
      }

      // Helpers

      function addToAccount(change: number, account: string) {
        if (!byAccount[account]) byAccount[account] = []
        const arr = byAccount[account]
        const lastTotalChange = arr[arr.length - 1]?.totalChange || 0
        const totalChange = round(lastTotalChange + change)
        arr.push({ date, totalChange, change, transaction })
      }
      function addDebt(change: number, instrument: number) {
        let target = byMerchant
        let debtor = merchant
        if (!merchant) {
          target = byPayee
          debtor = payee
        }
        if (!debtor) {
          console.error('No debtor', transaction)
          return
        }
        if (!target[debtor]) target[debtor] = {}
        if (!target[debtor][instrument]) target[debtor][instrument] = []
        const arr = target[debtor][instrument]
        const lastTotalChange = arr[arr.length - 1]?.totalChange || 0
        const totalChange = round(lastTotalChange + change)
        arr.push({ date, totalChange, change, transaction })
      }
    })

    return { byAccount, byMerchant, byPayee }
  }
)

export const accountBalanceGetter = createSelector(
  [getBalanceChanges, getAccounts],
  (changes, accounts) => (id: string, date: number) => {
    const acc = accounts[id]
    if (!acc) return 0
    const accChanges = changes.byAccount[id]
    if (!accChanges) return acc.startBalance

    for (let i = accChanges.length - 1; i >= 0; i--) {
      if (accChanges[i].date <= date) {
        return round(acc.startBalance + accChanges[i].totalChange)
      }
    }
    return acc.startBalance
  }
)
