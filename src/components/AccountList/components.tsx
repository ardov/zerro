import React, { FC, ReactChild } from 'react'
import {
  ListSubheader,
  Box,
  ListItemButtonProps,
  ListSubheaderProps,
  Typography,
  ListItemButton,
} from '@material-ui/core'
import { Amount } from 'components/Amount'
import { PopulatedAccount } from 'types'

export const Account: FC<
  { account: PopulatedAccount } & ListItemButtonProps
> = ({ account, sx, ...rest }) => {
  return (
    <ListItemButton sx={{ borderRadius: 1, ...sx }} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Typography
          component="span"
          noWrap
          sx={{ flexGrow: 1, lineHeight: 'inherit' }}
        >
          {account.title}
        </Typography>

        <Box
          component="span"
          ml={2}
          color={account.balance < 0 ? 'error.main' : 'text.secondary'}
        >
          <Amount
            value={account.balance}
            instrument={account.instrument}
            decMode="ifOnly"
          />
        </Box>
      </Box>
    </ListItemButton>
  )
}

export const Subheader: FC<
  {
    name: ReactChild
    amount: number
    currency?: string
  } & ListSubheaderProps
> = ({ name, amount, currency, sx, ...rest }) => {
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
            <Amount value={amount} currency={currency} decMode="ifOnly" />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}
