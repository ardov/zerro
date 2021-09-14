import React, { FC, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getTotalsArray } from '../../selectors/getTotalsByMonth'
import { convertCurrency } from 'store/data/selectors'
import { getInBudgetAccounts } from 'store/localData/accounts'
import { getUserCurrencyCode } from 'store/data/selectors'
import { Box, Typography, Button, Link } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import { Amount } from 'components/Amount'
import { resetData } from 'store/data'
import { clearLocalData } from 'logic/localData'
import { captureError, sendEvent } from 'helpers/tracking'
import { getDiff } from 'store/data'
import { getAccountsHistory } from 'scenes/Stats/selectors'
import { PopulatedAccount } from 'types'

// accaptable error due to roundings in calculations
const TOLERANCE = 1

export const CalculationErrorNotice: FC = () => {
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
    inBudgetSum = inBudgetSum + balance
  })

  const diff = Math.abs(moneyInBudget - inBudgetSum)
  const hasError = diff >= TOLERANCE && !transactionsToSync

  useEffect(() => {
    if (hasError) {
      console.log('🤨 Calc error:', diff, currency)
      captureError(new Error('Calculation Error'), { extra: diff } as any)
      sendEvent('Calculation Error: show message')
    }
  }, [diff, hasError, currency])

  if (!hasError || hidden) return null

  const reloadData = () => {
    sendEvent('Calculation Error: reload data')
    dispatch(resetData())
    dispatch(clearLocalData())
    window.location.reload()
  }
  const ignore = () => {
    sendEvent('Calculation Error: click ignore')
    setHidden(true)
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'error.main',
        color: 'error.contrastText',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'row',
      }}
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
          <CorruptedAccounts />
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

const CorruptedAccounts = () => {
  const histories = useSelector(getAccountsHistory)
  const accounts = useSelector(getInBudgetAccounts)
  const corrupted: { acc: PopulatedAccount; diff: number }[] = []
  accounts.forEach(acc => {
    const history = histories[acc.id]
    const lastPoint = history.length - 1
    const diff = Math.abs(history[lastPoint].balance - acc.balance)
    if (diff > 0.001) {
      corrupted.push({ acc, diff })
    }
  })

  console.log(
    'Corrupted accounts:',
    corrupted.map(({ acc, diff }) => ({
      acc: acc.title,
      diff,
    }))
  )
  if (corrupted.length === 0) {
    return null
  }
  return (
    <div>
      <Box component="p" mb={0}>
        Счета с ошибками:
      </Box>
      <Box component="ul" mt={0}>
        {corrupted.map(({ acc, diff }) => (
          <li>
            {acc.title} (
            <Amount
              value={diff}
              instrument={acc.instrument}
              decMode="ifAny"
              noShade
            />
            )
          </li>
        ))}
      </Box>
    </div>
  )
}
