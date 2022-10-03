import React, { FC, useEffect, useState } from 'react'
import { useAppDispatch } from '@store'
import {
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Popover,
  IconButton,
  PopoverProps,
} from '@mui/material'
import { CheckCircleIcon } from '@shared/ui/Icons'
import { AmountInput } from '@shared/ui/AmountInput'
import { formatMoney } from '@shared/helpers/money'
import { convertFx } from '@shared/helpers/money'
import { sendEvent } from '@shared/helpers/tracking'
import { Box, BoxProps } from '@mui/system'
import { TEnvelopeId, TFxAmount, TISOMonth } from '@shared/types'
import { useQuickActions } from './useQuickActions'
import { useMonthTotals, useRates } from '@entities/envelopeData'
import { setEnvelopeBudgets } from '@entities/budget'
import { useDisplayCurrency } from '@entities/instrument/hooks'

type TBudgetPopoverProps = PopoverProps & {
  id: TEnvelopeId
  month: TISOMonth
}

export const BudgetPopover: FC<
  PopoverProps & {
    id?: TEnvelopeId
    month?: TISOMonth
  }
> = ({ id, month, ...props }) => {
  if (!id || !month) return null
  return <BudgetPopoverContent id={id} month={month} {...props} />
}

const BudgetPopoverContent: FC<TBudgetPopoverProps> = props => {
  const { id, month, onClose, ...rest } = props
  const quickActions = useQuickActions(month, id)
  const displayCurrency = useDisplayCurrency()
  const dispatch = useAppDispatch()
  const rates = useRates(month)
  const envelope = useMonthTotals(month).envelopes[id]

  const currency = {
    env: envelope.currency, // Envelope currency
    disp: displayCurrency, // Display currency
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
    dispatch(setEnvelopeBudgets({ month, id, value }))

  const changeAndClose = (value: number) => {
    onClose?.({}, 'escapeKeyDown')
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
    <Popover onClose={() => changeAndClose(+inputValue)} {...rest}>
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
            <InputAdornment position="start">
              {envelope.currency}
            </InputAdornment>
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
    </Popover>
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