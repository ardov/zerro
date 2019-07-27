import React from 'react'
import styled from 'styled-components'
import { formatMoney } from 'helpers/format'

const colors = {
  income: 'var(--text-success)',
  outcome: 'var(--text-primary)',
  transfer: 'var(--text-secondary)',
}

const Body = styled.div`
  align-self: flex-end;
  color: ${props => colors[props.type]};
  text-align: right;
`
const PrimarySum = styled.span`
  color: ${({ type }) => colors[type]};

  :not(:only-child):first-child::after {
    margin: 0 8px;
    content: '→';
  }
`
const SecondarySum = styled.span`
  margin-right: 8px;
  color: var(--text-placeholder);
  font-size: 12px;
  line-height: 16px;
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
  opOutcomeInstrument,
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
