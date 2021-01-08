import React, { ChangeEvent, FC, useState } from 'react'
import {
  Box,
  Divider,
  Popover,
  PopoverProps,
  TextField,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Modify } from 'types'
import './styles.scss'
import { zmColors, colors } from './colors'

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    // gridGap: theme.spacing(1),
  },
}))

type ColorCheckProps = {
  hex: string
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const ColorCheck: FC<ColorCheckProps> = ({ hex, checked, onChange }) => {
  return (
    <label className={`color-check-label`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div
        className={`marker ${checked && 'checked'}`}
        style={{ backgroundColor: hex }}
      />
    </label>
  )
}

type ColorPickerProps = Modify<
  PopoverProps,
  {
    value: string
    onChange: (value: string) => void
  }
>

export const ColorPicker: FC<ColorPickerProps> = ({
  value,
  onChange,
  ...rest
}) => {
  const [hex, setHex] = useState(value)
  const c = useStyles()

  return (
    <Popover {...rest}>
      <Box p={2} pb={0}>
        <TextField variant="outlined" fullWidth value={hex} />
      </Box>
      <Box p={2} className={c.grid}>
        {zmColors.map(color => (
          <ColorCheck
            key={color}
            hex={color}
            checked={color?.toUpperCase() === value?.toUpperCase()}
            onChange={() => {
              setHex(color)
              onChange(color)
            }}
          />
        ))}
      </Box>
      <Divider />
      <Box p={2} className={c.grid}>
        {colors.map(color => (
          <ColorCheck
            key={color}
            hex={color}
            checked={color?.toUpperCase() === value?.toUpperCase()}
            onChange={() => {
              setHex(color)
              onChange(color)
            }}
          />
        ))}
      </Box>
    </Popover>
  )
}
