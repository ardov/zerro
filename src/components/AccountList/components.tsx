import React, { FC } from 'react'
import { formatMoney } from 'helpers/format'
import {
  ListItem,
  ListSubheader,
  Box,
  ListItemProps,
  Theme,
  ListSubheaderProps,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles((theme: Theme) => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

type AccProps = {
  title: string
  amount: number
  currency: string
}

export const Account: FC<AccProps & ListItemProps> = ({
  title,
  amount,
  currency,
  ...rest
}) => {
  const c = useStyles()
  return (
    // @ts-ignore
    <ListItem className={c.listItem} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Box flexGrow="1" component="span" className="MuiTypography-noWrap">
          {title}
        </Box>
        <Box
          component="span"
          ml={2}
          color={amount < 0 ? 'error.main' : 'text.secondary'}
        >
          {formatMoney(amount, currency, 0)}
        </Box>
      </Box>
    </ListItem>
  )
}

export const Subheader: FC<AccProps & ListSubheaderProps> = ({
  title,
  amount,
  currency,
  ...rest
}) => {
  const c = useStyles()
  return (
    // @ts-ignore
    <ListSubheader className={c.listItem} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Box flexGrow="1" component="span" className="MuiTypography-noWrap">
          <b>{title}</b>
        </Box>
        <Box
          component="span"
          ml={2}
          color={amount < 0 ? 'error.main' : 'text.secondary'}
        >
          <b>{formatMoney(amount, currency, 0)}</b>
        </Box>
      </Box>
    </ListSubheader>
  )
}
