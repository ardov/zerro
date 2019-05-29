import { getTransactionsById } from '../store/data/selectors/transaction'
import { format } from 'date-fns'

export default function exportCsv(_, getState) {
  const tr = getTransactionsById(getState())
  const csvContent = transactionsToCsvContent(tr)
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const href = window.URL.createObjectURL(blob)

  var link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute(
    'download',
    `transactions-${format(Date.now(), 'YYYYMMDD-HHmm')}.csv`
  )
  document.body.appendChild(link) // Required for FF

  link.click()
}

function transactionsToCsvContent(tr) {
  const head = [
    'Дата',
    'Создана',
    'Тип',
    'Категория',
    'Доп категрии',
    'Со счёта',
    'Расход',
    'Валюта -',
    'На счёт',
    'Доход',
    'Валюта +',
    'Плательщик',
    'Комментарий'
  ]
  let csvContent = head.join(',') + '\r\n'

  for (const id in tr) {
    const lineObj = transactionToRowObj(tr[id])
    const row = head.map(col => lineObj[col]).join(',')
    csvContent += row + '\r\n'
  }
  return csvContent
}

const types = {
  income: 'Доход',
  outcome: 'Расход',
  transfer: 'Перевод'
}

const transactionToRowObj = t => ({
  Дата: format(t.date, 'YYYY-MM-DD'),
  Создана: format(t.created, 'YYYY-MM-DD HH:mm'),
  Тип: types[t.type],
  Категория: t.tag ? t.tag[0].fullTitle : '',
  'Доп категрии': '',
  'Со счёта': t.outcomeAccount ? t.outcomeAccount.title : '',
  Расход: !!t.outcome ? t.outcome : '',
  'Валюта -': t.outcomeInstrument ? t.outcomeInstrument.shortTitle : '',
  'На счёт': t.incomeAccount ? t.incomeAccount.title : '',
  Доход: !!t.income ? t.income : '',
  'Валюта +': t.incomeInstrument ? t.incomeInstrument.shortTitle : '',
  Плательщик: t.payee,
  Комментарий: t.comment
})
