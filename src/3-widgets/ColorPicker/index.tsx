import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseColorInput } from '@/6-shared/helpers/color'
import { useAsked } from '@/6-shared/overlays'
import { ColorPickerPanel } from '@/6-shared/ui/kit/ColorPickerPanel'
import { PopoverSurface } from '@/6-shared/ui/kit/Popover'
import { colors } from './colors'

/** Closing applies a changed valid HEX draft; explicit selection/removal wins. */
export function ColorPicker(props: {
  value?: string | null
  anchorEl?: Element | null
}) {
  const { value = null, anchorEl } = props
  const { t } = useTranslation('colorPicker')
  const [draft, setDraft] = useState(value ?? '')
  const { controller, answer } = useAsked<string | null>(answer => {
    const parsed = parseColorInput(draft)
    if (parsed !== undefined && parsed !== (value?.toLowerCase() ?? null)) {
      answer(parsed)
    }
  })
  return (
    <PopoverSurface
      controller={controller}
      label={t('title')}
      anchor={anchorEl}
    >
      <ColorPickerPanel
        value={value}
        onChange={answer}
        draft={draft}
        onDraftChange={setDraft}
        colors={colors}
      />
    </PopoverSurface>
  )
}
