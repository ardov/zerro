import { Button } from '6-shared/ui/Button'
import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from '6-shared/ui/Popover'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import './styles.scss'
import { zmColors, colors } from './colors'
import { isHEX } from '6-shared/helpers/color'
import { useAsked } from '6-shared/overlays'

export type ColorPickerProps = {
  value?: string | null
  anchorEl?: Element | null
}

/** «Which colour?», asked of a person. Handed to `ask`:
 *
 * ```tsx
 * const color = await ask<string | null>(<ColorPicker value={colorHex} />)
 * if (color !== undefined) setColor(color)
 * ```
 *
 * A colour answers itself, «remove colour» answers `null`, and walking away
 * answers nothing — so `undefined` and «no colour» stay distinguishable. */
export const ColorPicker: FC<ColorPickerProps> = ({ value, anchorEl }) => {
  const { t } = useTranslation('envelopeEditDialog')
  const { open, answer } = useAsked<string | null>()
  // Opened fresh for every question, so the field starts from the value it was
  // asked about and needs no syncing back to it.
  const [custom, setCustom] = useState(value || '')

  const handleColorClick = (color?: string | null) => {
    if (isSameColor(value, color) || color === null) return answer(null)
    if (!isHEX(color)) return
    answer(color)
  }

  return (
    <Popover
      aria-label={t('color')}
      open={open}
      onClose={() => answer()}
      anchorEl={anchorEl}
    >
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
        <hr className="m-0 w-full border-0 border-b border-solid border-border" />
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
