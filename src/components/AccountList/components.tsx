import React, { FC, ReactNode, useCallback } from 'react'
import {
  ListSubheader,
  Box,
  ListItemButtonProps,
  ListSubheaderProps,
  Typography,
  ListItemButton,
} from '@mui/material'
import { toISOMonth } from '@shared/helpers/date'
import { Amount } from '@shared/ui/Amount'
import { TFxAmount } from '@shared/types'

import { useAppDispatch } from '@store'
import { accountModel, TAccountPopulated } from '@entities/account'
import {
  DisplayAmount,
  displayCurrency,
} from '@entities/currency/displayCurrency'

export const Account: FC<{ account: TAccountPopulated } & ListItemButtonProps> =
  ({ account, sx, ...rest }) => {
    const dispatch = useAppDispatch()
    const toggleInBalance = useCallback(
      () => dispatch(accountModel.setInBudget(account.id, !account.inBudget)),
      [account.id, account.inBudget, dispatch]
    )
    return (
      <ListItemButton
        sx={{
          typography: 'body2',
          borderRadius: 1,
          display: 'flex',
          ...sx,
        }}
        onDoubleClick={toggleInBalance}
        {...rest}
      >
        <Box
          sx={{
            textDecoration: account.archive ? 'line-through' : 'none',
            flexGrow: 1,
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maskImage: 'linear-gradient(to left, transparent, black 40px)',
          }}
          title={account.title}
        >
          {account.title}
        </Box>

        <Box
          component="span"
          sx={{
            ml: 1,
            flexShrink: 0,
            color: account.balance < 0 ? 'error.main' : 'text.secondary',
          }}
        >
          <Amount
            value={account.balance}
            currency={account.fxCode}
            decMode="ifOnly"
            noShade
          />
        </Box>
      </ListItemButton>
    )
  }

export const Subheader: FC<
  {
    name: ReactNode
    amount: TFxAmount
  } & ListSubheaderProps
> = ({ name, amount, sx, ...rest }) => {
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListSubheader sx={{ borderRadius: 1, ...sx }} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Typography
          component="span"
          noWrap
          sx={{ flexGrow: 1, lineHeight: 'inherit' }}
        >
          <b>{name}</b>
        </Typography>

        <Box
          component="span"
          ml={2}
          color={isNegative ? 'error.main' : 'text.secondary'}
        >
          <b>
            <DisplayAmount
              month={month}
              value={amount}
              decMode="ifOnly"
              noShade
            />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}
