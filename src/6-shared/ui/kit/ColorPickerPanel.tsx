import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getContrastText, isSameColor } from '@/6-shared/helpers/color'
import { AddIcon, DoneIcon } from '../Icons'
import { ColorPickerDropdown } from './ColorPickerDropdown'
import { PickerGridButton, usePickerGrid } from './PickerGrid'

export type ColorPickerPanelProps = {
  value: string | null
  onChange: (value: string | null) => void
  icon?: ReactNode
  colors: readonly string[]
}

export function ColorPickerPanel(props: ColorPickerPanelProps) {
  const { value, onChange, colors, icon } = props
  const { t } = useTranslation('colorPicker')
  const [customColors, setCustomColors] = useState<string[]>(() =>
    value ? [value] : []
  )
  const [pickingCustom, setPickingCustom] = useState(false)
  const palette = [
    ...colors,
    ...customColors.filter(c => !colors.some(base => isSameColor(base, c))),
  ]
  // While the dropdown is open, its colour gets a swatch of its own.
  const swatches = pickingCustom ? [...palette, value ?? '#ffffff'] : palette
  const grid = usePickerGrid(swatches.length + 1)
  return (
    <div {...grid.gridProps}>
      {swatches.map((color, index) => {
        const custom = pickingCustom && index === palette.length
        const selected = (custom || !pickingCustom) && isSameColor(color, value)
        return (
          <PickerGridButton
            key={custom ? 'custom-color' : color}
            tabIndex={grid.tabIndex(index)}
            label={color}
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : color)}
          >
            <span
              className="flex size-7 items-center justify-center rounded-full border border-ui-border"
              style={{
                backgroundColor: color,
                color: getContrastText(color),
              }}
            >
              {selected && <DoneIcon className="size-5" />}
            </span>
          </PickerGridButton>
        )
      })}
      <ColorPickerDropdown
        value={value}
        onChange={onChange}
        icon={icon}
        onClose={() => {
          if (value && !palette.some(c => isSameColor(c, value)))
            setCustomColors(previous => [...previous, value])
          setPickingCustom(false)
        }}
        trigger={
          <PickerGridButton
            className="text-ui-secondary"
            tabIndex={grid.tabIndex(swatches.length)}
            onClick={() => setPickingCustom(true)}
            label={t('custom')}
          >
            <AddIcon />
          </PickerGridButton>
        }
      />
    </div>
  )
}
