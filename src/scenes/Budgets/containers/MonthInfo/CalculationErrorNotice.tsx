import React, { FC, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getTotalsArray } from '../../selectors'
import { convertCurrency, getUserCurrencyCode } from 'store/data/instruments'
import { getInBudgetAccounts } from 'store/data/accounts'
import { round } from 'helpers/currencyHelpers'
import { Box, Typography, Button, Link } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import { Amount } from 'components/Amount'
import { resetData } from 'store/data'
import { clearLocalData } from 'logic/localData'
import { captureError, sendEvent } from 'helpers/tracking'
import { getDiff } from 'store/data'
import { getAccountsHistory } from 'scenes/Stats/selectors'
import { PopulatedAccount } from 'types'

// TODO: Надо бы как-то округлять все цифры только в конце. Иначе из-за валют копится ошибка.
const TOLERANCE = 3

/**
 * Shows error message if sum of accounts in balance is not equal to calculated amount of money in balance. There are 3 main reasons for this:
 * - Corrupted accounts. For some old acoounts `balance !== startBalance + transactions`. It's known ZM bug.
 * - Rounding of numbers during the calculations. Numbers are rounded on the each step so it's getting worse with long history and transactions in different currencies. That's why we need some.
 * - Errors during the calculations.
 */
export const CalculationErrorNotice: FC = () => {
  const [hidden, setHidden] = useState(false)

  const histories = useSelector(getAccountsHistory)
  const corrupted = useSelector(getInBudgetAccounts)
    .map(acc => {
      const history = histories[acc.id]
      const lastPoint = history.length - 1
      const calculatedBalance = history[lastPoint].balance
      const diff = Math.abs(calculatedBalance - acc.balance)
      return { acc, diff }
    })
    .filter(({ diff }) => diff > 0.001)

  const synced = useSelector(state => !getDiff(state)?.transaction?.length)
  const currency = useSelector(getUserCurrencyCode)
  const dispatch = useDispatch()

  const totalsArray = useSelector(getTotalsArray)
  const { moneyInBudget } = totalsArray[totalsArray.length - 1]

  const convert = useSelector(convertCurrency)
  const inBudgetSum = useSelector(getInBudgetAccounts).reduce(
    (sum, acc) => sum + convert(acc.balance, acc.instrument),
    0
  )

  const diff = round(Math.abs(moneyInBudget - inBudgetSum))
  const hasError = diff >= TOLERANCE && synced

  useEffect(() => {
    if (hasError) {
      if (corrupted.length) {
        console.warn('🤨 Corrupted accounts:', diff, currency, corrupted)
        captureError(new Error('Corrupted Accounts Error'), {
          diff,
          currency,
          accs: corrupted.length,
        } as any)
      } else {
        console.warn('🤨 Calc error:', diff, currency)
        captureError(new Error('Calculation Error'), { diff, currency } as any)
      }
      sendEvent('Calculation Error: show message')
    }
  }, [diff, hasError, currency, corrupted])

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
          <CorruptedAccounts corrupted={corrupted} />
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

const CorruptedAccounts: FC<{
  corrupted: {
    acc: PopulatedAccount
    diff: number
  }[]
}> = props => {
  const corrupted = props.corrupted

  console.warn(
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
