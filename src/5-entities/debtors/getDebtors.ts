import { createSelector } from '@reduxjs/toolkit'
import {
  ById,
  TAccountId,
  TTransaction,
  TMerchant,
  TMerchantId,
  TInstrument,
  TFxAmount,
} from '6-shared/types'
import { round } from '6-shared/helpers/money'
import { withPerf } from '6-shared/helpers/performance'

import { TSelector } from 'store'
import { accountModel } from '5-entities/account'
import { trModel, TrType } from '5-entities/transaction'
import { cleanPayee } from '5-entities/shared/cleanPayee'
import { getMerchants } from '5-entities/merchant'
import { instrumentModel } from '5-entities/currency/instrument'

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
  [
    trModel.getTransactionsHistory,
    getMerchants,
    instrumentModel.getInstruments,
    accountModel.getDebtAccountId,
  ],
  withPerf('getDebtors', collectDebtors)
)

function collectDebtors(
  trList: TTransaction[],
  merchants: ById<TMerchant>,
  instruments: ById<TInstrument>,
  debtAccId?: TAccountId
): ById<TDebtor> {
  const debtors: ById<TDebtor> = {}
  trList.forEach(tr => {
    const trType = trModel.getType(tr, debtAccId)
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
      let fxCode = instruments[tr.incomeInstrument].shortTitle
      debtor.balance[fxCode] ??= 0
      debtor.balance[fxCode] = round(debtor.balance[fxCode] - tr.income)
    } else {
      let fxCode = instruments[tr.outcomeInstrument].shortTitle
      debtor.balance[fxCode] ??= 0
      debtor.balance[fxCode] = round(debtor.balance[fxCode] + tr.outcome)
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
