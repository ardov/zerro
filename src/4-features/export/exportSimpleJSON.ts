import {
  PopulatedTransaction,
  getPopulatedTransactions,
} from './populateTransaction'
import { formatDate } from '6-shared/helpers/date'
import { AppThunk } from 'store'
import { TrType } from '5-entities/transaction'

// TODO: i18n
const transactionTypes = {
  [TrType.Income]: 'Income',
  [TrType.Outcome]: 'Expense',
  [TrType.Transfer]: 'Transfer',
  [TrType.OutcomeDebt]: 'Debt Payment',
  [TrType.IncomeDebt]: 'Debt Repayment',
}

function transactionToJsonObj(t: PopulatedTransaction) {
  return {
    id: t.id,
    date: formatDate(t.created, 'yyyy-MM-dd'),
    created: formatDate(t.created, 'yyyy-MM-dd HH:mm'),
    type: transactionTypes[t.type as TrType] || t.type,

    fromAccount: t.outcomeAccount ? t.outcomeAccount.title : null,
    toAccount: t.incomeAccount ? t.incomeAccount.title : null,
    outcome: t.outcome || 0,
    outcomeCurrency: t.outcomeInstrument ? t.outcomeInstrument.shortTitle : null,
    income: t.income || 0,
    incomeCurrency: t.incomeInstrument ? t.incomeInstrument.shortTitle : null,

    payee: t.payee || null,
    comment: t.comment || null,
    tags: t.tag ? t.tag.map(tag => tag.title) : [],
  }
}

export const exportSimpleJSON: AppThunk = (_, getState) => {
  const transactions = getPopulatedTransactions(getState())

  const jsonData = Object.values(transactions)
    .filter(tr => !tr.deleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(transactionToJsonObj)

  const content = JSON.stringify(jsonData, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const href = window.URL.createObjectURL(blob)
  const fileName = `transactions-${formatDate(Date.now(), 'yyyyMMdd-HHmm')}.json`

  const link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute('download', fileName)
  document.body.appendChild(link) // Required for FF
  link.click()

  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(href)
    document.body.removeChild(link)
  }, 100)
}
