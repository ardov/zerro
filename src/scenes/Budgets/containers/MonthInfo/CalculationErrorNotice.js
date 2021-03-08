import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getTotalsArray } from '../../selectors/getTotalsByMonth'
import { convertCurrency } from 'store/serverData'
import { getInBudgetAccounts } from 'store/localData/accounts'
import { round } from 'helpers/currencyHelpers'
import { getUserCurrencyCode } from 'store/serverData'
import { Box, Typography, Button, Link } from '@material-ui/core'
import WarningIcon from '@material-ui/icons/Warning'
import { Amount } from 'components/Amount'
import { wipeData } from 'store/commonActions'
import { clearLocalData } from 'logic/localData'
import { captureError, sendEvent } from 'helpers/tracking'
import { getDiff } from 'store/dataSlice'

const TOLERANCE = 2

export function CalculationErrorNotice(props) {
  const [hidden, setHidden] = useState(false)

  const transactionsToSync = useSelector(
    state => getDiff(state)?.transaction?.length || 0
  )
  const currency = useSelector(getUserCurrencyCode)
  const dispatch = useDispatch()

  const totalsArray = useSelector(getTotalsArray)
  const { moneyInBudget } = totalsArray[totalsArray.length - 1]

  const accsInBudget = useSelector(getInBudgetAccounts)
  const convert = useSelector(convertCurrency)
  let inBudgetSum = 0
  accsInBudget.forEach(acc => {
    const balance = convert(acc.balance, acc.instrument)
    inBudgetSum = round(inBudgetSum + balance)
  })

  const diff = round(Math.abs(moneyInBudget - inBudgetSum))
  const hasError = diff >= TOLERANCE && !transactionsToSync

  useEffect(() => {
    if (hasError) {
      console.log('🤨 Calc error:', diff, currency)
      captureError(new Error('Calculation Error'), { extra: diff })
      sendEvent('Calculation Error: show message')
    }
  }, [diff, hasError, currency])

  if (!hasError || hidden) return null

  const reloadData = () => {
    sendEvent('Calculation Error: reload data')
    dispatch(wipeData())
    dispatch(clearLocalData())
    window.location.reload()
  }
  const ignore = () => {
    sendEvent('Calculation Error: click ignore')
    setHidden(true)
  }

  return (
    <Box
      p={2}
      bgcolor="error.main"
      color="error.contrastText"
      borderRadius={8}
      display="flex"
      flexDirection="row"
    >
      <Box pt="2px">
        <WarningIcon />
      </Box>
      <Box ml={1.5}>
        <Typography variant="subtitle1">
          Ошибка в вычислениях на{' '}
          <Amount value={diff} currency={currency} noShade />
        </Typography>
        <Box mt={1}>
          <Typography variant="body2">
            Попробуйте обновить данные. Если сообщение не пропадёт, напишите мне
            в телеграме (
            <Link
              color="inherit"
              href="http://t.me/ardov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              @ardov
            </Link>
            ), чтобы я помог разобраться с проблемой.
          </Typography>
        </Box>

        <Box mt={2}>
          <Button color="inherit" variant="outlined" onClick={reloadData}>
            Обновить данные
          </Button>
        </Box>
        <Box mt={2}>
          <Button color="inherit" variant="outlined" onClick={ignore}>
            Игнорировать
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
