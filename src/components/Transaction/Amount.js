import React from 'react'
import styled from 'styled-components'

const colors = {
  income: '#21A355',
  outcome: 'rgba(0, 0, 0, 0.8)',
  transfer: 'rgba(0, 0, 0, 0.5)'
}

const Body = styled.div`
  align-self: flex-end;
  text-align: right;
  color: ${props => colors[props.type]};
`
const PrimarySum = styled.span`
  color: ${({ type }) => colors[type]};
  :not(:only-child):first-child::after {
    content: '→';
    margin: 0 8px;
  }
`
const SecondarySum = styled.span`
  color: rgba(0, 0, 0, 0.4);
  font-size: 12px;
  line-height: 16px;
  margin-right: 8px;
`

export function Amount({
  type,
  income,
  incomeInstrument,
  opIncome,
  opIncomeInstrument,
  outcome,
  outcomeInstrument,
  opOutcome,
  opOutcomeInstrument
}) {
  switch (type) {
    case 'transfer':
      const formattedIncome = formatAmount(income, incomeInstrument.shortTitle)
      const formattedOutcome = formatAmount(
        outcome,
        outcomeInstrument.shortTitle
      )
      if (formattedIncome === formattedOutcome) {
        return (
          <Body>
            <PrimarySum type={type}>{formattedIncome}</PrimarySum>
          </Body>
        )
      } else {
        return (
          <Body>
            <PrimarySum type={type}>{formattedOutcome}</PrimarySum>
            <PrimarySum type={type}>{formattedIncome}</PrimarySum>
          </Body>
        )
      }
    case 'income':
      return (
        <Body>
          {!!opIncome && opIncomeInstrument && (
            <SecondarySum>
              +{formatAmount(opIncome, opIncomeInstrument.shortTitle)}
            </SecondarySum>
          )}
          <PrimarySum type={type}>
            +{formatAmount(income, incomeInstrument.shortTitle)}
          </PrimarySum>
        </Body>
      )
    case 'outcome':
      return (
        <Body>
          {!!opOutcome && opOutcomeInstrument && (
            <SecondarySum>
              −{formatAmount(opOutcome, opOutcomeInstrument.shortTitle)}
            </SecondarySum>
          )}
          <PrimarySum type={type}>
            −{formatAmount(outcome, outcomeInstrument.shortTitle)}
          </PrimarySum>
        </Body>
      )

    default:
      break
  }
}

function formatAmount(amount, shortCode) {
  return new Intl.NumberFormat('ru', {
    style: 'currency',
    currency: shortCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
