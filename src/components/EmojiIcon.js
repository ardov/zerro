import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box, Checkbox } from '@material-ui/core'

const sizes = { s: 32, m: 40 }
const fonts = { s: '4em', m: '6em' }

const useStyles = makeStyles(theme => ({
  symbol: {
    width: ({ size }) => sizes[size],
    height: ({ size }) => sizes[size],
    color: ({ color }) => (color ? color : theme.palette.text.primary),
    borderRadius: '50%',
    border: ({ color }) => (color ? `1px solid ${color}` : 'none'),
    backgroundColor: theme.palette.action.hover,

    '&:hover .checkbox': {
      opacity: ({ isInteractive }) => (isInteractive ? 1 : 0),
      transition: '.2s',
    },
    '&:not(:hover) .checkbox': {
      opacity: ({ showCheckBox, checked }) => (showCheckBox || checked ? 1 : 0),
      transition: '.2s',
    },
    '&:hover .emoji': {
      opacity: ({ isInteractive }) => (isInteractive ? 0 : 1),
      transition: '.2s',
    },
    '&:not(:hover) .emoji': {
      opacity: ({ showCheckBox, checked }) => (showCheckBox || checked ? 0 : 1),
      transition: '.2s',
    },
  },

  emoji: {
    position: 'absolute',
    fontSize: ({ size }) => fonts[size],
    transform: 'scale(.25)',
    textAlign: 'center',
  },
}))

export default function EmojiIcon({
  symbol,
  color,
  size = 's',
  onChange,
  checked,
  showCheckBox,
  checkboxProps,
  ...rest
}) {
  const c = useStyles({
    color,
    size,
    isInteractive: !!onChange,
    showCheckBox,
    checked,
  })

  return (
    <Box
      className={c.symbol}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      {...rest}
    >
      <span className={c.emoji + ' emoji'}>{symbol}</span>
      {onChange && (
        <Checkbox
          className="checkbox"
          checked={checked}
          onClick={e => e.stopPropagation()}
          onChange={onChange}
          color="primary"
          {...checkboxProps}
        />
      )}
    </Box>
  )
}
