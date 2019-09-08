import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  symbol: {
    width: 24,
    height: 24,
    color: ({ color }) => (color ? color : theme.palette.text.primary),
    fontSize: '24px',
    lineHeight: '24px',
    textAlign: 'center',
  },
}))

export default function EmojiIcon({ symbol, color, ...rest }) {
  const c = useStyles({ color })

  return (
    <Box className={c.symbol} {...rest}>
      {symbol}
    </Box>
  )
}
