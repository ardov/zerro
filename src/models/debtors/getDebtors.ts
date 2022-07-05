import { createSelector } from '@reduxjs/toolkit'
import { add, sub } from 'shared/helpers/currencyHelpers'
import { getDebtAccountId, TAccountId } from 'models/account'
import { getMerchants } from 'models/data/selectors'
import {
  getTransactionsHistory,
  TrType,
  TTransaction,
} from 'models/transaction'
import { getType } from 'models/transaction/helpers'
import { ById } from 'shared/types'
import { TInstrumentId } from 'models/instrument'
import { TMerchant, TMerchantId } from 'models/merchant'
import { TSelector } from 'models'
import { cleanPayee } from 'models/shared/cleanPayee'

type TFxAmount = {
  [currency: TInstrumentId]: number
}

export type TDebtor = {
  id: string
  name: string
  merchantId?: TMerchantId
  merchantName?: string
  payeeNames: string[]
  transactions: TTransaction[]
  balance: TFxAmount
}

export const getDebtors: TSelector<ById<TDebtor>> = createSelector(
  [getTransactionsHistory, getMerchants, getDebtAccountId],
  collectDebtors
)

function collectDebtors(
  trList: TTransaction[],
  merchants: ById<TMerchant>,
  debtAccId?: TAccountId
): ById<TDebtor> {
  const debtors: ById<TDebtor> = {}
  trList.forEach(tr => {
    const trType = getType(tr, debtAccId)
    if (trType !== TrType.IncomeDebt && trType !== TrType.OutcomeDebt) {
      // Not debt transaction
      return
    }
    let debtor
    if (tr.merchant) {
      let merchant = merchants[tr.merchant]
      let id = cleanPayee(merchant.title)
      debtor = debtors[id] ??= makeDebtorFromMerchant(merchant)
      debtor.merchantId = merchant.id
      debtor.merchantName = merchant.title
      debtor.transactions.push(tr)
    } else if (tr.payee) {
      let payee = tr.payee
      let id = cleanPayee(payee)
      debtor = debtors[id] ??= makeDebtorFromPayee(payee)
      if (!debtor.payeeNames.includes(payee)) {
        debtor.payeeNames.push(payee)
      }
      debtor.transactions.push(tr)
    }
    if (!debtor) return
    if (trType === TrType.IncomeDebt) {
      debtor.balance[tr.incomeInstrument] ??= 0
      debtor.balance[tr.incomeInstrument] = sub(
        debtor.balance[tr.incomeInstrument],
        tr.income
      )
    } else {
      debtor.balance[tr.outcomeInstrument] ??= 0
      debtor.balance[tr.outcomeInstrument] = add(
        debtor.balance[tr.outcomeInstrument],
        tr.outcome
      )
    }
  })
  return debtors
}

function makeDebtorFromMerchant(merchant: TMerchant): TDebtor {
  return {
    id: cleanPayee(merchant.title),
    name: merchant.title,
    merchantId: merchant.id,
    merchantName: merchant.title,
    payeeNames: [],
    transactions: [],
    balance: {},
  }
}

function makeDebtorFromPayee(payee: string): TDebtor {
  return {
    id: cleanPayee(payee),
    name: payee,
    merchantId: undefined,
    merchantName: undefined,
    payeeNames: [payee],
    transactions: [],
    balance: {},
  }
}
