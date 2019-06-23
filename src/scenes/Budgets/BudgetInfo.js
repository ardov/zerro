import React from 'react'
import { formatMoney } from 'Utils/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import styled, { css } from 'styled-components'

const getMonthName = date => format(date, 'MMM', { locale: ru }).toLowerCase()

const Body = styled.div`
  position: relative;
  min-width: 0;
  padding: 112px 16px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
`

const ToBeBudgeted = styled.div`
  position: absolute;
  top: -1px;
  right: -1px;
  left: -1px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 104px;
  background: linear-gradient(
      105.52deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 100%
    ),
    #cc1414;
  box-shadow: 0px 8px 16px rgba(204, 20, 20, 0.3);
  border-radius: 6px;
  padding: 16px;
  transition: 0.4s;

  ${props =>
    props.positive &&
    css`
      background: linear-gradient(
          105.67deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 100%
        ),
        #21a355;
      box-shadow: 0px 8px 16px rgba(33, 163, 85, 0.3);
    `}
`

const Amount = styled.div`
  color: #fff;
  font-weight: normal;
  font-size: 32px;
  line-height: 40px;
`

const Text = styled.div`
  color: #fff;
`
export default function BudgetInfo({ month, instrument, className }) {
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
  const currency = instrument.shortTitle
  return (
    <Body className={className}>
      <ToBeBudgeted positive={toBeBudgeted >= 0}>
        <Amount>{formatSum(toBeBudgeted)}</Amount>
        <Text>Осталось запланировать</Text>
      </ToBeBudgeted>
      <Line
        name={`Доход за ${getMonthName(date)}`}
        amount={income}
        currency={currency}
      />
      <Line
        name={`Остаток с прошлого`}
        amount={prevFunds - prevOverspent}
        currency={currency}
      />
      <Line
        name={`В плане на ${getMonthName(date)}`}
        amount={budgeted}
        currency={currency}
      />
      <Line
        name={`Переводы`}
        amount={transferIncome - transferOutcome}
        currency={currency}
      />
    </Body>
  )
}

function Line({ name, amount, currency }) {
  return (
    <LineBody>
      <LineName>{name}</LineName>
      <div>{formatMoney(amount, currency)}</div>
    </LineBody>
  )
}
const LineBody = styled.div`
  display: flex;
  flex-direction: row;
  min-width: 0;
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.5);
`
const LineName = styled.div`
  flex-grow: 1;
  min-width: 0;
  margin-right: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
