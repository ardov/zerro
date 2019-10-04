import React from 'react'
import { Box, Typography } from '@material-ui/core'
import { formatMoney } from 'helpers/format'

const colors = {
  income: 'success.main',
  outcome: 'text.primary',
  transfer: 'text.secondary',
}

const Body = props => <Box alignSelf="flex-end" textAlign="right" {...props} />

const PrimarySum = ({ type, children }) => (
  <Box color={colors[type]} clone>
    <Typography variant="body1" component="span">
      {children}
    </Typography>
  </Box>
)

const SecondarySum = ({ children }) => (
  <Box mr={1} color="text.hint" clone>
    <Typography variant="body2" component="span">
      {children}
    </Typography>
  </Box>
)

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
            {' → '}
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
