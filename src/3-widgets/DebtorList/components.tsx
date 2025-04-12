import React, { FC, ReactNode } from 'react'
import {
  ListSubheader,
  Box,
  ListItemButtonProps,
  ListSubheaderProps,
  Typography,
  ListItemButton,
} from '@mui/material'
import { TFxAmount, TFxCode } from '6-shared/types'
import { Amount } from '6-shared/ui/Amount'
import {
  DisplayAmount,
  displayCurrency,
} from '5-entities/currency/displayCurrency'
import { toISOMonth } from '6-shared/helpers/date'
import { Tooltip } from '6-shared/ui/Tooltip'

export const Debtor: FC<
  { name: string; currency: TFxCode; balance: number } & ListItemButtonProps
> = ({ name, currency, balance, sx, ...rest }) => {
  return (
    <ListItemButton
      sx={{
        typography: 'body2',
        borderRadius: 1,
        display: 'flex',
        ...sx,
      }}
      {...rest}
    >
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maskImage: 'linear-gradient(to left, transparent, black 40px)',
        }}
        title={name}
      >
        {name}
      </Box>

      <Box
        component="span"
        sx={{
          ml: 1,
          flexShrink: 0,
          color: balance < 0 ? 'error.main' : 'text.secondary',
        }}
      >
        <Tooltip
          title={<Amount value={balance} currency={currency} noShade />}
          disableInteractive
          placement="right"
        >
          <div>
            <Amount
              value={balance}
              currency={currency}
              decMode="ifOnly"
              noShade
            />
          </div>
        </Tooltip>
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
  return (
    <ListSubheader sx={{ borderRadius: 1, ...sx }} {...rest}>
      <Box
        component="span"
        sx={{
          display: 'flex',
          width: '100%',
        }}
      >
        <Typography
          component="span"
          noWrap
          sx={{ flexGrow: 1, lineHeight: 'inherit' }}
        >
          <b>{name}</b>
        </Typography>

        <Box
          component="span"
          sx={{
            ml: 2,
            color: toDisplay(amount) < 0 ? 'error.main' : 'text.secondary',
          }}
        >
          <b>
            <DisplayAmount
              value={amount}
              month={month}
              decMode="ifOnly"
              noShade
            />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}
