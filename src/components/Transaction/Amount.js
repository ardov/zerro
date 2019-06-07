import React from 'react'
import styled from 'styled-components'
import { formatMoney } from '../../Utils/format'

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
      const formattedIncome = formatMoney(income, incomeInstrument.shortTitle)
      const formattedOutcome = formatMoney(
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
              +{formatMoney(opIncome, opIncomeInstrument.shortTitle)}
            </SecondarySum>
          )}
          <PrimarySum type={type}>
            +{formatMoney(income, incomeInstrument.shortTitle)}
          </PrimarySum>
        </Body>
      )
    case 'outcome':
      return (
        <Body>
          {!!opOutcome && opOutcomeInstrument && (
            <SecondarySum>
              −{formatMoney(opOutcome, opOutcomeInstrument.shortTitle)}
            </SecondarySum>
          )}
          <PrimarySum type={type}>
            −{formatMoney(outcome, outcomeInstrument.shortTitle)}
          </PrimarySum>
        </Body>
      )

    default:
      break
  }
}
