import { Button } from '6-shared/ui/Button'
import type { ChangeEvent, FC } from 'react'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PopoverProps } from '@mui/material'
import { Divider, Popover } from '@mui/material'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import './styles.scss'
import { zmColors, colors } from './colors'
import { isHEX } from '6-shared/helpers/color'
import { registerPopover } from '6-shared/historyPopovers'

export type ColorPickerProps = {
  value?: string | null
  onColorChange?: (value: string | null) => void
}

const colorPicker = registerPopover<ColorPickerProps, PopoverProps>(
  'colorPicker',
  {}
)

export const useColorPicker = (
  value: ColorPickerProps['value'],
  onColorChange: ColorPickerProps['onColorChange']
) => {
  const { open } = colorPicker.useMethods()
  return useCallback(
    (e: React.MouseEvent) => {
      open({ value, onColorChange }, { anchorEl: e.currentTarget })
    },
    [onColorChange, open, value]
  )
}

export const ColorPicker: FC = () => {
  const { t } = useTranslation('envelopeEditDialog')
  const popover = colorPicker.useProps()
  const { value, onColorChange } = popover.extraProps
  const [custom, setCustom] = useState(value || '')
  const handleColorClick = (color?: string | null) => {
    if (isSameColor(value, color) || color === null) {
      onColorChange?.(null)
      popover.close()
      return
    }
    if (!isHEX(color)) return
    setCustom(color)
    onColorChange?.(color)
    popover.close()
  }
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    setCustom(value || '')
  }

  return (
    <Popover {...popover.displayProps}>
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-6">
          {zmColors.map(color => (
            <ColorCheck
              key={color}
              hex={color}
              checked={color?.toUpperCase() === value?.toUpperCase()}
              onChange={() => handleColorClick(color)}
            />
          ))}
        </div>
        <Divider />
        <div className="grid grid-cols-6">
          {colors.map(color => (
            <ColorCheck
              key={color}
              hex={color}
              checked={color?.toUpperCase() === value?.toUpperCase()}
              onChange={() => handleColorClick(color)}
            />
          ))}
        </div>
        <OutlinedField
          fullWidth
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="#000000"
          endAdornment={
            <ColorCheck
              hex={isHEX(custom) ? custom : value}
              checked={isSameColor(value, custom)}
              onChange={() => handleColorClick(custom)}
            />
          }
        />
        <Button fullWidth onClick={() => handleColorClick(null)}>
          {t('removeColor')}
        </Button>
      </div>
    </Popover>
  )
}

function isSameColor(a?: string | null, b?: string | null) {
  if (!a && !b) return true
  if (a && b) return a.toLowerCase() === b.toLowerCase()
  return false
}

type ColorCheckProps = {
  hex?: string | null
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
