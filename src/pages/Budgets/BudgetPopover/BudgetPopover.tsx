import React, { FC, useEffect, useState } from 'react'
import {
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Box, BoxProps } from '@mui/system'
import { CheckCircleIcon } from '@shared/ui/Icons'
import { AmountInput } from '@shared/ui/AmountInput'
import { formatMoney } from '@shared/helpers/money'
import { convertFx } from '@shared/helpers/money'
import { sendEvent } from '@shared/helpers/tracking'
import { TFxAmount, TISOMonth } from '@shared/types'
import { AdaptivePopover } from '@shared/ui/AdaptivePopover'
import { TPopoverProps } from '@shared/ui/PopoverManager'

import { useAppDispatch } from '@store'
import { balances } from '@entities/envBalances'
import { useQuickActions } from './useQuickActions'
import { setTotalBudget } from '@features/budget/setTotalBudget'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { TEnvelopeId } from '@entities/envelope'

export type TBudgetPopoverProps = TPopoverProps & {
  id: TEnvelopeId
  month: TISOMonth
}

export const BudgetPopover: FC<TBudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const quickActions = useQuickActions(month, id)
  const [dispCurrency] = displayCurrency.useDisplayCurrency()
  const dispatch = useAppDispatch()
  const rates = balances.useRates()[month].rates
  const envelope = balances.useEnvData()[month][id]

  const currency = {
    env: envelope.currency, // Envelope currency
    disp: dispCurrency, // Display currency
  }
  /** Functions to convert amounts */
  const convert = {
    toEnv: (a: TFxAmount) => convertFx(a, currency.env, rates),
    toDisp: (a: TFxAmount) => convertFx(a, currency.disp, rates),
  }
  /** Formatters */
  const format = {
    env: (v: number) => formatMoney(v, currency.env),
    disp: (v: number) => formatMoney(v, currency.disp),
  }
  /** Current budgeted */
  const budgeted = {
    env: convert.toEnv(envelope.totalBudgeted),
    disp: convert.toDisp(envelope.totalBudgeted),
  }
  /** Current available */
  const available = {
    env: convert.toEnv(envelope.totalAvailable),
    disp: convert.toDisp(envelope.totalAvailable),
  }

  /** Input value sets in envelope currency */
  const [inputValue, setInputValue] = useState<number>(budgeted.env)

  /** Input value converted to envelope and display currencies */
  const value = {
    env: inputValue,
    disp: convert.toDisp({ [currency.env]: inputValue }),
  }
  /** Amount of money that will be available after changes applied */
  const availableAfter = {
    env: value.env - budgeted.env + available.env,
    disp: value.disp - budgeted.disp + available.disp,
  }

  useEffect(() => {
    setInputValue(budgeted.env)
  }, [budgeted.env])

  const onChange = (value: number) =>
    dispatch(setTotalBudget({ month, id, value }))

  const changeAndClose = (value: number) => {
    onClose?.()
    if (value !== budgeted.env) onChange(value)
  }

  const helperText =
    currency.env !== currency.disp ? (
      <>
        {format.disp(value.disp)}
        <br />
        Остаток {format.env(availableAfter.env)} (
        {format.disp(availableAfter.disp)})
      </>
    ) : (
      `Остаток ${format.env(availableAfter.env)}`
    )

  return (
    <AdaptivePopover
      onClose={() => changeAndClose(+inputValue)}
      anchor="top"
      {...rest}
    >
      <AmountInput
        autoFocus
        value={inputValue}
        fullWidth
        onChange={value => setInputValue(+value)}
        onEnter={value => changeAndClose(+value)}
        helperText={helperText}
        signButtons="auto"
        placeholder="0"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">{currency.env}</InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => changeAndClose(+inputValue)}
              >
                <CheckCircleIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <List>
        {quickActions.map(({ text, amount }) => (
          <ListItemButton
            key={text}
            selected={inputValue === amount}
            onClick={() => {
              sendEvent('Budgets: quick budget: ' + text)
              changeAndClose(amount)
            }}
          >
            <ListItemText
              primary={<NameValueRow name={text} value={format.env(amount)} />}
            />
            {/* <ListItemText primary={format.tag(amount)} /> */}
          </ListItemButton>
        ))}
      </List>
    </AdaptivePopover>
  )
}

const NameValueRow: FC<BoxProps & { name: string; value: string }> = ({
  name,
  value,
  ...rest
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        gap: 2,
        '& > :first-of-type': { flexGrow: 1 },
        '& > :last-child': { color: 'text.secondary' },
      }}
      {...rest}
    >
      <span>{name}</span>
      <span>{value}</span>
    </Box>
  )
}
