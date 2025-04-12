import React from 'react'
import {
  Box,
  BoxProps,
  Checkbox,
  CheckboxProps,
  SxProps,
  Theme,
} from '@mui/material'
import { Modify } from '6-shared/types'

const sizes = { s: 32, m: 40 }
const fonts = { s: '1rem', m: '1.5rem' }

export type EmojiIconProps = Modify<
  BoxProps,
  {
    symbol: string
    color?: string | null
    size?: 's' | 'm'
    onChange?: CheckboxProps['onChange']
    checked?: CheckboxProps['checked']
    showCheckBox?: boolean
    checkboxProps?: CheckboxProps
    button?: boolean
  }
>

export function EmojiIcon(props: EmojiIconProps) {
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
  const isInteractive = !!onChange

  const symbolSx: SxProps<Theme> = {
    width: sizes[size],
    height: sizes[size],
    flexShrink: 0,
    color: theme =>
      theme.palette.getContrastText(color || theme.palette.background.paper),
    cursor: button ? 'pointer' : 'auto',
    borderRadius: '50%',
    border: color ? `1px solid ${color}` : 'none',
    background: color
      ? 'linear-gradient(-30deg, rgba(255,255,255,0.2), transparent)'
      : 'none',
    backgroundColor: theme => (color ? color : theme.palette.action.hover),
    transition: '.2s ease-in-out',

    '&:hover': {
      transform: button ? 'scale(1.1)' : 'none',
    },
    '&:active': {
      transform: button ? 'scale(1)' : 'none',
      transition: '.1s ease-in-out',
    },

    '& .checkbox': {
      position: 'absolute',
    },
    '&:hover .checkbox': {
      opacity: isInteractive ? 1 : 0,
      transition: '.2s',
    },
    '&:not(:hover) .checkbox': {
      opacity: showCheckBox || checked ? 1 : 0,
      transition: '.2s',
    },

    '& .emoji': {
      fontSize: fonts[size],
    },
    '&:hover .emoji': {
      opacity: isInteractive ? 0 : 1,
      transition: '.2s',
    },
    '&:not(:hover) .emoji': {
      opacity: showCheckBox || checked ? 0 : 1,
      transition: '.2s',
    },
  }

  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        ...(Array.isArray(symbolSx) ? symbolSx : [symbolSx]),
        rest.sx,
      ]}
    >
      <span className="emoji">{symbol}</span>
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
