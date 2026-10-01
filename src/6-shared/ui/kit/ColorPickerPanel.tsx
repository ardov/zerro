import { useTranslation } from 'react-i18next'
import { FieldAddon } from './Field'
import { getContrastText, parseColorInput } from '@/6-shared/helpers/color'
import { ArrowForwardIcon, DoneIcon } from '../Icons'
import { Button, IconButton } from './Button'
import { Input } from './Input'

export type ColorPickerPanelProps = {
  value: string | null
  onChange: (value: string | null) => void
  colors: readonly string[]
  /** Owned above adaptive surfaces so unfinished input survives remounts. */
  draft: string
  onDraftChange: (value: string) => void
}

/** Palette and HEX draft editing. The containing surface applies its draft on close. */
export function ColorPickerPanel(props: ColorPickerPanelProps) {
  const { value, onChange, colors, draft, onDraftChange } = props
  const { t } = useTranslation('colorPicker')
  const parsed = parseColorInput(draft)
  const apply = () => {
    if (parsed !== undefined) onChange(parsed)
  }
  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('input')}
        start={
          <FieldAddon kind="icon">
            {parsed != null && (
              <span
                aria-hidden="true"
                className="size-7 rounded-full border border-ui-border"
                style={{ backgroundColor: parsed }}
              />
            )}
          </FieldAddon>
        }
        end={
          <FieldAddon kind="action">
            <IconButton
              label={t('apply')}
              variant="ghost"
              size="sm"
              disabled={parsed === undefined}
              onClick={apply}
            >
              <ArrowForwardIcon />
            </IconButton>
          </FieldAddon>
        }
        value={draft}
        onFocus={event => event.currentTarget.select()}
        onChange={event => onDraftChange(event.target.value)}
        placeholder="#000000"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            event.stopPropagation()
            apply()
          }
        }}
      />
      <div className="grid grid-cols-6 gap-1">
        {colors.map(color => {
          const selected = color.toLowerCase() === value?.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className="focusable flex aspect-square min-h-10 items-center justify-center rounded-ui-control-inner rounded-smooth hover:bg-ui-highlight"
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
            </button>
          )
        })}
      </div>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => onChange(null)}
      >
        {t('remove')}
      </Button>
    </div>
  )
}
