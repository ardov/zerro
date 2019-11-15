import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box } from '@material-ui/core'

const sizes = {
  s: 32,
  m: 40,
}

const useStyles = makeStyles(theme => ({
  symbol: {
    width: ({ size }) => sizes[size],
    height: ({ size }) => sizes[size],
    color: ({ color }) => (color ? color : theme.palette.text.primary),
    borderRadius: '50%',
    border: ({ color }) => (color ? `1px solid ${color}` : 'none'),
    backgroundColor: theme.palette.action.hover,
  },

  emoji: { fontSize: '4em', transform: 'scale(.25)', textAlign: 'center' },
}))

export default function EmojiIcon({ symbol, color, size = 's', ...rest }) {
  const c = useStyles({ color, size })

  return (
    <Box
      className={c.symbol}
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      <span className={c.emoji}>{symbol}</span>
    </Box>
  )
}
