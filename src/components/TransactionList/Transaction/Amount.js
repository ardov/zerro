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

const SecondarySum = ({ amount, currency }) =>
  !!amount && (
    <Box mr={1} color="text.hint" clone>
      <Typography variant="body2" component="span">
        {amount > 0 && '+'}
        {formatMoney(amount, currency)}
      </Typography>
    </Box>
  )

export function Amount({
  type,
  income,
  incomeCurrency,
  opIncome,
  opIncomeCurrency,
  outcome,
  outcomeCurrency,
  opOutcome,
  opOutcomeCurrency,
}) {
  const formattedIncome = formatMoney(income, incomeCurrency)
  const formattedOutcome = formatMoney(outcome, outcomeCurrency)

  switch (type) {
    case 'transfer':
      return formattedIncome === formattedOutcome ? (
        <Body>
          <PrimarySum type={type}>{formattedIncome}</PrimarySum>
        </Body>
      ) : (
        <Body>
          <PrimarySum type={type}>{formattedOutcome}</PrimarySum>
          {' → '}
          <PrimarySum type={type}>{formattedIncome}</PrimarySum>
        </Body>
      )

    case 'income':
      return (
        <Body>
          <SecondarySum amount={opIncome} currency={opIncomeCurrency} />
          <PrimarySum type={type}>+{formattedIncome}</PrimarySum>
        </Body>
      )

    case 'outcome':
      return (
        <Body>
          <SecondarySum
            amount={opOutcome && -opOutcome}
            currency={opOutcomeCurrency}
          />
          <PrimarySum type={type}>−{formattedOutcome}</PrimarySum>
        </Body>
      )

    default:
      break
  }
}
