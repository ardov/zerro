import React from 'react'
import { useSelector } from 'react-redux'
import { getTotalsByMonth } from '../selectors/getTotalsByMonth'
import { convertCurrency } from 'store/serverData'
import { Box } from '@material-ui/core'
import { getAccountsInBudget } from 'store/localData/accounts'
import { round } from 'helpers/currencyHelpers'
import { useDevMode } from 'helpers/useDevMode'

export default function WarningSign({ ...rest }) {
  const [devMode] = useDevMode()
  const totalsArray = useSelector(getTotalsByMonth)
  const { moneyInBudget } = totalsArray[totalsArray.length - 1]

  const accsInBudget = useSelector(getAccountsInBudget)
  const convert = useSelector(convertCurrency)
  let inBudgetSum = 0
  accsInBudget.forEach(acc => {
    const balance = convert(acc.balance, acc.instrument)
    inBudgetSum = round(inBudgetSum + balance)
  })

  const isEqual = round(moneyInBudget) === round(inBudgetSum)
  if (!isEqual) console.log(moneyInBudget, inBudgetSum)

  return devMode ? (
    <Box
      position="fixed"
      top="8px"
      right="8px"
      zIndex={9999}
      textAlign="center"
      p={1}
      bgcolor="white"
      color="white"
      borderRadius="16px"
    >
      {isEqual ? '✅' : '❌'}
    </Box>
  ) : null
}
