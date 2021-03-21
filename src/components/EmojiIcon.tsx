import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box, BoxProps, Checkbox, CheckboxProps } from '@material-ui/core'
import { Modify } from 'types'

const sizes = { s: 32, m: 40 }
const fonts = { s: '4em', m: '6em' }

type EmojiIconProps = Modify<
  BoxProps,
  {
    symbol: string
    color?: string
    size?: 's' | 'm'
    onChange: CheckboxProps['onChange']
    checked: CheckboxProps['checked']
    showCheckBox: boolean
    checkboxProps?: CheckboxProps
    button?: boolean
  }
>

interface StylesProps {
  symbol: string
  color?: string
  size: 's' | 'm'
  isInteractive: boolean
  checked: CheckboxProps['checked']
  showCheckBox: boolean
  button: boolean
}

const useStyles = makeStyles(theme => ({
  symbol: {
    width: ({ size }: StylesProps) => sizes[size],
    height: ({ size }: StylesProps) => sizes[size],
    color: ({ color }: StylesProps) => theme.palette.text.primary,
    cursor: ({ button }: StylesProps) => (button ? 'pointer' : 'auto'),
    borderRadius: '50%',
    border: ({ color }: StylesProps) => (color ? `1px solid ${color}` : 'none'),
    background: ({ color }: StylesProps) =>
      color
        ? 'linear-gradient(-30deg, rgba(255,255,255,0.2), transparent)'
        : 'none',
    backgroundColor: ({ color }: StylesProps) =>
      color ? color : theme.palette.action.hover,
    transition: '.2s ease-in-out',

    '&:hover': {
      transform: ({ button }: StylesProps) => (button ? 'scale(1.1)' : 'none'),
    },
    '&:active': {
      transform: ({ button }: StylesProps) => (button ? 'scale(1)' : 'none'),
      transition: '.1s ease-in-out',
    },

    '&:hover .checkbox': {
      opacity: ({ isInteractive }: StylesProps) => (isInteractive ? 1 : 0),
      transition: '.2s',
    },
    '&:not(:hover) .checkbox': {
      opacity: ({ showCheckBox, checked }: StylesProps) =>
        showCheckBox || checked ? 1 : 0,
      transition: '.2s',
    },
    '&:hover .emoji': {
      opacity: ({ isInteractive }: StylesProps) => (isInteractive ? 0 : 1),
      transition: '.2s',
    },
    '&:not(:hover) .emoji': {
      opacity: ({ showCheckBox, checked }: StylesProps) =>
        showCheckBox || checked ? 0 : 1,
      transition: '.2s',
    },
  },

  emoji: {
    position: 'absolute',
    fontSize: ({ size }: StylesProps) => fonts[size],
    transform: 'scale(.25)',
    textAlign: 'center',
  },
}))

export default function EmojiIcon(props: EmojiIconProps) {
  const {
    symbol,
    color,
    size = 's',
    onChange,
    checked,
    showCheckBox,
    checkboxProps,
    button = false,
    ...rest
  } = props
  const c = useStyles({
    color,
    size,
    isInteractive: !!onChange,
    button,
    showCheckBox,
    checked,
  } as StylesProps)

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
