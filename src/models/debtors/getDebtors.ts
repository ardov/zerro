import { createSelector } from '@reduxjs/toolkit'
import { add, sub } from 'shared/helpers/money'
import { getDebtAccountId } from 'models/account'
import { getTransactionsHistory, TrType } from 'models/transaction'
import { getType } from 'models/transaction/helpers'
import {
  ById,
  TAccountId,
  ITransaction,
  IMerchant,
  TMerchantId,
  IInstrument,
  TFxAmount,
} from 'shared/types'
import { TSelector } from 'store'
import { cleanPayee } from 'models/shared/cleanPayee'
import { getMerchants } from 'models/merchant'
import { getInstruments } from 'models/instrument'

export type TDebtor = {
  id: string
  name: string
  merchantId?: TMerchantId
  merchantName?: string
  payeeNames: string[]
  transactions: ITransaction[]
  balance: TFxAmount
}

export const getDebtors: TSelector<ById<TDebtor>> = createSelector(
  [getTransactionsHistory, getMerchants, getInstruments, getDebtAccountId],
  collectDebtors
)

function collectDebtors(
  trList: ITransaction[],
  merchants: ById<IMerchant>,
  instruments: ById<IInstrument>,
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
      let fxCode = instruments[tr.incomeInstrument].shortTitle
      debtor.balance[fxCode] ??= 0
      debtor.balance[fxCode] = sub(debtor.balance[fxCode], tr.income)
    } else {
      let fxCode = instruments[tr.outcomeInstrument].shortTitle
      debtor.balance[fxCode] ??= 0
      debtor.balance[fxCode] = add(debtor.balance[fxCode], tr.outcome)
    }
  })
  return debtors
}

function makeDebtorFromMerchant(merchant: IMerchant): TDebtor {
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
