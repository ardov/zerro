import React from 'react'
import styled from 'styled-components'

const colors = {
  income: '#21A355',
  outcome: 'rgba(0, 0, 0, 0.8)',
  transfer: 'rgba(0, 0, 0, 0.5)'
}

const Sum = styled.div`
  grid-area: amount;
  text-align: right;
  color: ${props => colors[props.kind]};
`

export function Amount({ data }) {
  const { type, income, outcome, incomeInstrument, outcomeInstrument } = data
  const amount1 = type === 'income' ? income : outcome
  const instrument1 = type === 'income' ? incomeInstrument : outcomeInstrument
  const formatMoney = new Intl.NumberFormat('ru', {
    style: 'currency',
    currency: instrument1.shortTitle,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format

  return (
    <Sum kind={type}>
      {type === 'income' && '+'}
      {type === 'outcome' && '−'}
      {formatMoney(amount1)}
    </Sum>
  )
}
