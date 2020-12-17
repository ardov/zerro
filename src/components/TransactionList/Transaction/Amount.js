import React from 'react'
import { Box, Typography } from '@material-ui/core'
import { formatMoney, rateToWords } from 'helpers/format'
import { withStyles } from '@material-ui/core/styles'

const Body = props => <Box alignSelf="flex-end" textAlign="right" {...props} />

const colors = {
  income: 'success.main',
  outcome: 'text.primary',
  transfer: 'text.secondary',
}

const PrimarySum = ({ type, children }) => (
  <Box color={colors[type]} clone>
    <Typography variant="body1" component="span">
      {children}
    </Typography>
  </Box>
)

const StyledTypography = withStyles(theme => ({
  root: { marginRight: theme.spacing(1), color: theme.palette.text.hint },
}))(Typography)

const SecondarySum = ({ amount, currency }) =>
  !!amount && (
    <StyledTypography variant="body2" component="span">
      {amount > 0 && '+'}
      {formatMoney(amount, currency)}
    </StyledTypography>
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

  if (type === 'transfer') {
    const equalCurrency = incomeCurrency === outcomeCurrency
    return formattedIncome === formattedOutcome ? (
      <Body>
        <PrimarySum type={type}>{formattedIncome}</PrimarySum>
      </Body>
    ) : (
      <Body
        title={
          equalCurrency
            ? ''
            : rateToWords(income, incomeCurrency, outcome, outcomeCurrency)
        }
      >
        <PrimarySum type={type}>{formattedOutcome}</PrimarySum>
        {' → '}
        <PrimarySum type={type}>{formattedIncome}</PrimarySum>
      </Body>
    )
  }

  if (type === 'income') {
    if (!opIncome) {
      return (
        <Body>
          <PrimarySum type={type}>−{formattedIncome}</PrimarySum>
        </Body>
      )
    }
    return (
      <Body
        title={rateToWords(opIncome, opIncomeCurrency, income, incomeCurrency)}
      >
        <SecondarySum amount={opIncome} currency={opIncomeCurrency} />
        <PrimarySum type={type}>+{formattedIncome}</PrimarySum>
      </Body>
    )
  }

  if (type === 'outcome') {
    if (!opOutcome) {
      return (
        <Body>
          <PrimarySum type={type}>−{formattedOutcome}</PrimarySum>
        </Body>
      )
    }
    return (
      <Body
        title={rateToWords(
          opOutcome,
          opOutcomeCurrency,
          outcome,
          outcomeCurrency
        )}
      >
        <SecondarySum
          amount={opOutcome && -opOutcome}
          currency={opOutcomeCurrency}
        />
        <PrimarySum type={type}>−{formattedOutcome}</PrimarySum>
      </Body>
    )
  }
}
