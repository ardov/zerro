import React from 'react'
import { formatMoney } from 'helpers/format'
import { ListItem, ListSubheader, ListItemText, Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

export function Account({ title, amount, currency, ...rest }) {
  const c = useStyles()
  return (
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

export function Subheader({ title, amount, currency, ...rest }) {
  const c = useStyles()
  return (
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
