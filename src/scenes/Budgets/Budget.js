import React from 'react'
import { formatMoney } from 'Utils/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import styled from 'styled-components'

const getMonthName = date =>
  format(date, 'MMM YYYY', { locale: ru }).toUpperCase()

const ToBeBudgeted = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: 16px;
`
export function Budget({ month, instrument }) {
  const {
    date,
    prevOverspent,
    funds,
    toBeBudgeted,
    income,
    outcome,
    availible,
    overspent,
    prevFunds,
    transferIncome,
    transferOutcome,
    budgeted,
  } = month
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)
  return (
    <div>
      <h1>{getMonthName(date)}</h1>
      <ToBeBudgeted className="bg-red">
        <h2>{formatSum(toBeBudgeted)}</h2>
      </ToBeBudgeted>
      <div />
      <p>
        Остаток с прошлого месяца {formatSum(prevFunds - prevOverspent)} (
        {formatSum(prevFunds)} - {formatSum(prevOverspent)})
      </p>
      <p>На балансе в конце месяца {formatSum(funds - overspent)}</p>
      <p>-</p>
      <p>Перерасхоод с прошлого месяца {formatSum(prevOverspent)}</p>
      <p>Забюджетирвано {formatSum(budgeted)}</p>
      <p>Доступно {formatSum(availible)}</p>
      <p>Доход {formatSum(income)}</p>
      <p>
        Переводы вне баланса {formatSum(transferIncome - transferOutcome)} (+
        {formatSum(transferIncome)}, -{formatSum(transferOutcome)})
      </p>
      <p>-</p>
      <p>Расход {formatSum(outcome)}</p>
    </div>
  )
}
