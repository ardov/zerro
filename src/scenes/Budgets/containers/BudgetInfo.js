import React from 'react'
import { connect } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import styled, { css } from 'styled-components'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { getUserCurrencyCode } from 'store/serverData'

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
  padding: 16px;
  background: linear-gradient(
      105.52deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 100%
    ),
    #cc1414;
  border-radius: 6px;
  box-shadow: 0 8px 16px rgba(204, 20, 20, 0.3);
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
      box-shadow: 0 8px 16px rgba(33, 163, 85, 0.3);
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
function BudgetInfo({
  date,
  prevOverspent,
  toBeBudgeted,
  income,
  prevFunds,
  transferIncome,
  transferOutcome,
  budgeted,
  budgetedInFuture,
  currency,
  ...rest
}) {
  const formatSum = sum => formatMoney(sum, currency)

  return (
    <Body {...rest}>
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
        name={`План на ${getMonthName(date)}`}
        amount={-budgeted}
        currency={currency}
      />
      <Line
        name={`Переводы`}
        amount={transferIncome - transferOutcome}
        currency={currency}
      />
      <Line
        name={`Запланировано в будущем`}
        amount={-budgetedInFuture}
        currency={currency}
      />
    </Body>
  )
}

const mapStateToProps = (state, { index }) => ({
  ...getTotalsByMonth(state)[index],
  currency: getUserCurrencyCode(state),
})

export default connect(mapStateToProps, null)(BudgetInfo)

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
  color: var(--text-secondary);
`
const LineName = styled.div`
  flex-grow: 1;
  min-width: 0;
  margin-right: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
