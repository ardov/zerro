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
import { PopulatedAccount, Selector } from 'types'
import { createSelector } from 'reselect'

// TODO: Надо бы как-то округлять все цифры только в конце. Иначе из-за валют копится ошибка.
const TOLERANCE = 3

/**
 * Shows error message if sum of accounts in balance is not equal to calculated amount of money in balance. There are 3 main reasons for this:
 * - Corrupted accounts. For some old acoounts `balance !== startBalance + transactions`. It's known ZenMoney bug.
 * - Rounding of numbers during the calculations. Numbers are rounded on the each step so it's getting worse with long history and transactions in different currencies. That's why we need some.
 * - Errors during the calculations.
 */
export const CalculationErrorNotice: FC = () => {
  const [hidden, setHidden] = useState(false)
  const dispatch = useDispatch()
  const isSynced = useSelector(state => !getDiff(state)?.transaction?.length)
  const corruptedAccounts = useSelector(getCorruptedAccounts)
  const diff = useSelector(getTotalDiff)
  const currency = useSelector(getUserCurrencyCode)
  const hasError = diff >= TOLERANCE && isSynced
  const hasCorruptedAccs = !!corruptedAccounts.length

  useEffect(() => {
    if (hasError) {
      if (corruptedAccounts.length) {
        console.warn(
          '🤨 Corrupted accounts:',
          diff,
          currency,
          corruptedAccounts
        )
        sendEvent('Corrupted accounts: show message')
      } else {
        console.warn('🤨 Calc error:', diff, currency)
        captureError(new Error('Calculation Error'), { diff, currency } as any)
        sendEvent('Calculation Error: show message')
      }
    }
  }, [diff, hasError, currency, corruptedAccounts])

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
      <Box pt="4px">
        <WarningIcon />
      </Box>
      <Box ml={1.5}>
        {hasCorruptedAccs ? (
          <>
            <Typography variant="h6">
              Нашлись счета с ошибками на{' '}
              <Amount value={diff} currency={currency} noShade />
            </Typography>
            <Box mt={1}>
              <Typography variant="body1">
                Ничего страшного, просто нажмите «Обновить данные» внизу.
                <br />
                Не помогло? Тогда в{' '}
                <A href="https://zenmoney.ru/a/#accounts">Дзен-мани</A> обновите
                начальный остаток у счетов из списка ниже. Поменяйте его,
                сохраните, и верните обратно.
                <br />
                Опять не помогло? Тогда смело пишите мне в телеграме (
                <A href="https://t.me/ardov">@ardov</A>
                ), чтобы я помог разобраться с проблемой.
              </Typography>
              <CorruptedAccounts corrupted={corruptedAccounts} />
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h6">
              Ошибка в вычислениях на{' '}
              <Amount value={diff} currency={currency} noShade />
            </Typography>
            <Box mt={1}>
              <Typography variant="body1">
                Попробуйте обновить данные. Если сообщение не пропадёт, напишите
                мне в телеграме (<A href="https://t.me/ardov">@ardov</A>
                ), чтобы я помог разобраться с проблемой.
              </Typography>
            </Box>
          </>
        )}

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

const A: FC<{ href: string }> = props => (
  <Link
    color="inherit"
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: 'underline' }}
  >
    {props.children}
  </Link>
)

const CorruptedAccounts: FC<{
  corrupted: {
    acc: PopulatedAccount
    diff: number
  }[]
}> = ({ corrupted }) => {
  if (!corrupted?.length) return null
  return (
    <div>
      <Box component="p" mb={0}>
        Счета с ошибками:
      </Box>
      <Box component="ul" mt={0}>
        {corrupted.map(({ acc, diff }) => (
          <li key={acc.id}>
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

const getCorruptedAccounts: Selector<
  { acc: PopulatedAccount; diff: number }[]
> = createSelector(
  [getAccountsHistory, getInBudgetAccounts],
  (histories, accounts) =>
    accounts
      .map(acc => {
        const history = histories[acc.id]
        if (!history) {
          console.warn('Empty history for account ' + acc.id, acc)
          return { acc, diff: 0 }
        }
        const lastPoint = history.length - 1
        const calculatedBalance = history[lastPoint].balance
        const diff = Math.abs(calculatedBalance - acc.balance)
        return { acc, diff }
      })
      .filter(({ diff }) => diff > 0.001)
)

const getTotalDiff: Selector<number> = createSelector(
  [getTotalsArray, getInBudgetAccounts, convertCurrency],
  (totalsArray, accounts, convert) => {
    const { moneyInBudget } = totalsArray[totalsArray.length - 1]
    const inBudgetSum = accounts
      .map(acc => convert(acc.balance, acc.instrument))
      .reduce((sum, value) => sum + value, 0)
    return Math.abs(round(moneyInBudget - inBudgetSum))
  }
)
