import { createSelector } from '@reduxjs/toolkit'
import {
  PopulatedTransaction,
  populateTransaction,
} from './populateTransaction'
import { formatDate } from '@shared/helpers/date'
import { ById } from '@shared/types'
import { AppThunk } from '@store'
import { trModel, TrType } from '@entities/transaction'
import { instrumentModel } from '@entities/currency/instrument'
import { accountModel } from '@entities/account'
import { getPopulatedTags } from '@entities/tag'

// Only for CSV
const getPopulatedTransactions = createSelector(
  [
    instrumentModel.getInstruments,
    accountModel.getAccounts,
    getPopulatedTags,
    trModel.getTransactions,
  ],
  (instruments, accounts, tags, transactions) => {
    const result: { [id: string]: PopulatedTransaction } = {}
    for (const id in transactions) {
      result[id] = populateTransaction(
        { instruments, accounts, tags },
        transactions[id]
      )
    }
    return result
  }
)

export const exportCSV: AppThunk = (_, getState) => {
  const tr = getPopulatedTransactions(getState())
  const csvContent = transactionsToCsvContent(tr)
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const href = window.URL.createObjectURL(blob)

  var link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute(
    'download',
    `transactions-${formatDate(Date.now(), 'yyyyMMdd-HHmm')}.csv`
  )
  document.body.appendChild(link) // Required for FF

  link.click()
}

interface RowObj {
  Дата: string
  Создана: string
  Тип: string
  Категория: string
  'Доп категории': string
  'Со счёта': string
  Расход: string | number
  'Валюта -': string
  'На счёт': string
  Доход: string | number
  'Валюта +': string
  Плательщик: string
  Комментарий: string
}
type Column = keyof RowObj

const head: Column[] = [
  'Дата',
  'Создана',
  'Тип',
  'Категория',
  'Доп категории',
  'Со счёта',
  'Расход',
  'Валюта -',
  'На счёт',
  'Доход',
  'Валюта +',
  'Плательщик',
  'Комментарий',
]

function transactionsToCsvContent(tr: ById<PopulatedTransaction>) {
  let csvContent = head.join(',') + '\r\n'

  for (const id in tr) {
    if (!tr[id].deleted) {
      const lineObj = transactionToRowObj(tr[id])
      const row = head.map(col => lineObj[col]).join(',')
      csvContent += row + '\r\n'
    }
  }
  return csvContent
}

const types = {
  [TrType.Income]: 'Доход',
  [TrType.Outcome]: 'Расход',
  [TrType.Transfer]: 'Перевод',
  [TrType.OutcomeDebt]: '',
  [TrType.IncomeDebt]: '',
}

const transactionToRowObj = (t: PopulatedTransaction): RowObj => ({
  Дата: t.date,
  Создана: formatDate(t.created, 'yyyy-MM-dd HH:mm'),
  Тип: types[t.type as TrType],
  Категория: t.tag ? t.tag[0].title.replace(',', '') : '',
  'Доп категории': '',
  'Со счёта': t.outcomeAccount ? t.outcomeAccount.title : '',
  Расход: !!t.outcome ? t.outcome : '',
  'Валюта -': t.outcomeInstrument ? t.outcomeInstrument.shortTitle : '',
  'На счёт': t.incomeAccount ? t.incomeAccount.title : '',
  Доход: !!t.income ? t.income : '',
  'Валюта +': t.incomeInstrument ? t.incomeInstrument.shortTitle : '',
  Плательщик: t.payee || '',
  Комментарий: t.comment || '',
})
