import React, { ChangeEvent, FC, useEffect, useState } from 'react'
import {
  Box,
  Divider,
  InputAdornment,
  Popover,
  PopoverProps,
  TextField,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Modify } from 'types'
import './styles.scss'
import { zmColors, colors } from './colors'
import { isHEX } from 'helpers/convertColor'

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
  },
}))

type ColorCheckProps = {
  hex?: string
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}
const ColorCheck: FC<ColorCheckProps> = ({ hex, checked, onChange }) => {
  if (!hex) return null
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
    value?: string
    onChange: (value: string | null) => void
    onClose: () => void
  }
>
export const ColorPicker: FC<ColorPickerProps> = ({
  value,
  onChange,
  onClose,
  ...rest
}) => {
  const [custom, setCustom] = useState(value || '')
  const c = useStyles()
  const handleColorClick = (color?: string) => {
    if (isSameColor(value, color)) {
      onChange(null)
      onClose()
      return
    }
    if (!isHEX(color)) return
    setCustom(color)
    onChange(color)
    onClose()
  }
  useEffect(() => {
    setCustom(value || '')
  }, [value])

  return (
    <Popover onClose={onClose} {...rest}>
      <Box p={2}>
        <Box mb={2} className={c.grid}>
          {zmColors.map(color => (
            <ColorCheck
              key={color}
              hex={color}
              checked={color?.toUpperCase() === value?.toUpperCase()}
              onChange={() => handleColorClick(color)}
            />
          ))}
        </Box>
        <Divider />
        <Box py={2} className={c.grid}>
          {colors.map(color => (
            <ColorCheck
              key={color}
              hex={color}
              checked={color?.toUpperCase() === value?.toUpperCase()}
              onChange={() => handleColorClick(color)}
            />
          ))}
        </Box>
        <TextField
          variant="outlined"
          fullWidth
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="#000000"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <ColorCheck
                  hex={isHEX(custom) ? custom : value}
                  checked={isSameColor(value, custom)}
                  onChange={() => handleColorClick(custom)}
                />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Popover>
  )
}

function isSameColor(a?: string | null, b?: string | null) {
  if (!a && !b) return true
  if (a && b) return a.toLowerCase() === b.toLowerCase()
  return false
}
