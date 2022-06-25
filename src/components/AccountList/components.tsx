import React, { FC, ReactChild, useCallback } from 'react'
import {
  ListSubheader,
  Box,
  ListItemButtonProps,
  ListSubheaderProps,
  Typography,
  ListItemButton,
} from '@mui/material'
import { Amount } from 'components/Amount'
import { TPopulatedAccount } from 'shared/types'
import { useAppDispatch } from 'models'
import { setInBudget } from 'models/data/accounts'

export const Account: FC<{ account: TPopulatedAccount } & ListItemButtonProps> =
  ({ account, sx, ...rest }) => {
    const dispatch = useAppDispatch()
    const toggleInBalance = useCallback(
      () => dispatch(setInBudget(account.id, !account.inBalance)),
      [account.id, account.inBalance, dispatch]
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
            instrument={account.instrument}
            decMode="ifOnly"
            noShade
          />
        </Box>
      </ListItemButton>
    )
  }

export const Subheader: FC<
  {
    name: ReactChild
    amount: number
  } & ListSubheaderProps
> = ({ name, amount, sx, ...rest }) => {
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
          color={amount < 0 ? 'error.main' : 'text.secondary'}
        >
          <b>
            <Amount value={amount} instrument="user" decMode="ifOnly" noShade />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}
