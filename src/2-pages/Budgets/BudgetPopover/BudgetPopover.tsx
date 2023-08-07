import React, { FC, useEffect, useState } from 'react'
import {
  ListItemText,
  InputAdornment,
  IconButton,
  PopoverProps,
  MenuList,
  MenuItem,
} from '@mui/material'
import { Box, BoxProps } from '@mui/system'
import { useTranslation } from 'react-i18next'
import { DoneIcon } from '6-shared/ui/Icons'
import { AmountInput } from '6-shared/ui/AmountInput'
import { formatMoney } from '6-shared/helpers/money'
import { convertFx } from '6-shared/helpers/money'
import { sendEvent } from '6-shared/helpers/tracking'
import { TFxAmount, TISOMonth } from '6-shared/types'
import { AdaptivePopover } from '6-shared/ui/AdaptivePopover'

import { useAppDispatch } from 'store'
import { balances } from '5-entities/envBalances'
import { useQuickActions } from './useQuickActions'
import { setTotalBudget } from '4-features/budget/setTotalBudget'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { TEnvelopeId } from '5-entities/envelope'

export type TBudgetPopoverProps = Omit<PopoverProps, 'onClose'> & {
  onClose: () => void
  id: TEnvelopeId
  month: TISOMonth
}

export const BudgetPopover: FC<TBudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const { t } = useTranslation()
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
        {t('leftover')} {format.env(availableAfter.env)} (
        {format.disp(availableAfter.disp)})
      </>
    ) : (
      `${t('leftover')} ${format.env(availableAfter.env)}`
    )

  return (
    <AdaptivePopover
      onClose={() => changeAndClose(+inputValue)}
      anchor="top"
      {...rest}
    >
      <Box p={1}>
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
                  <DoneIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <MenuList>
          {quickActions.map(({ text, amount }) => (
            <MenuItem
              key={text}
              selected={inputValue === amount}
              sx={{ borderRadius: 1 }}
              onClick={() => {
                sendEvent('Budgets: quick budget: ' + text)
                changeAndClose(amount)
              }}
            >
              <ListItemText
                primary={
                  <NameValueRow name={text} value={format.env(amount)} />
                }
              />
            </MenuItem>
          ))}
        </MenuList>
      </Box>
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
