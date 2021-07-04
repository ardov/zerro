import React, { FC, ReactChild } from 'react'
import {
  ListItem,
  ListSubheader,
  Box,
  ListItemProps,
  Theme,
  ListSubheaderProps,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Amount } from 'components/Amount'
import { PopulatedAccount } from 'types'

const useStyles = makeStyles((theme: Theme) => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

export const Account: FC<{ account: PopulatedAccount } & ListItemProps> = ({
  account,
  ...rest
}) => {
  const c = useStyles()
  return (
    // @ts-ignore
    <ListItem className={c.listItem} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Box flexGrow="1" component="span" className="MuiTypography-noWrap">
          {account.title}
        </Box>
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
    </ListItem>
  )
}

export const Subheader: FC<
  {
    name: ReactChild //string | JSX.Element
    amount: number
    currency?: string
  } & ListSubheaderProps
> = ({ name, amount, currency, ...rest }) => {
  const c = useStyles()
  return (
    // @ts-ignore
    <ListSubheader className={c.listItem} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Box flexGrow="1" component="span" className="MuiTypography-noWrap">
          <b>{name}</b>
        </Box>
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
