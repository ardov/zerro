import { memo, useCallback, useRef, useState } from 'react'
import { useStore } from 'react-redux'
import { v1 as uuidv1 } from 'uuid'
import { useTranslation } from 'react-i18next'
import { useAsk, useAsked } from '@/6-shared/overlays'
import { track } from '@/6-shared/analytics'
import { CategoryIcon, CategorySymbol } from '@/6-shared/ui/CategoryIcon'
import { ColorPickerPanel } from '@/6-shared/ui/kit/ColorPickerPanel'
import { PickerGridButton, usePickerGrid } from '@/6-shared/ui/kit/PickerGrid'
import { PopoverSurface } from '@/6-shared/ui/kit/Popover'
import { categoryIconById } from '@/6-shared/zenmoney-assets'
import { core } from '@/zerro-core/redux'
import { useAppDispatch, useAppSelector, type RootState } from '@/store'
import { categoryColors } from '@/6-shared/zenmoney-assets/categoryColors'
import { selectableIcons } from './icons'

/** A category's icon that opens its colour and icon picker. */
export function AppearancePicker({
  envelope,
  size = 's',
}: {
  envelope: core.envelopes.TPresentedEnvelope
  size?: 's' | 'm'
}) {
  const { t } = useTranslation('colorPicker')
  const ask = useAsk()
  const icon = (
    <CategoryIcon
      symbol={envelope.symbol}
      color={envelope.colorHex}
      size={size}
    />
  )
  if (!core.envelopes.hasEditableAppearance(envelope.id)) return icon
  return (
    <button
      type="button"
      data-surface-interactive
      className="tag-icon focusable shrink-0 cursor-pointer rounded-full motion-safe:hover:scale-110 motion-safe:active:scale-100"
      aria-label={t('title')}
      onClick={event =>
        void ask(
          <AppearancePopover
            id={envelope.id}
            tagId={envelope.entityId}
            anchor={event.currentTarget}
          />
        )
      }
    >
      {icon}
    </button>
  )
}

function AppearancePopover({
  id,
  tagId,
  anchor,
}: {
  id: core.envelopes.TEnvelopeId
  tagId: string
  anchor: HTMLElement
}) {
  const { t } = useTranslation('colorPicker')
  const { controller } = useAsked()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const tag = useAppSelector(state => core.tags.selectPopulated(state)[tagId])
  // The palette is fixed for one opening, so a drag does not reflow it.
  const [palette] = useState(() => {
    const swatches = new Set<string>(categoryColors)
    for (const category of Object.values(
      core.tags.selectPopulated(store.getState())
    )) {
      if (category.colorHEX) swatches.add(category.colorHEX.toUpperCase())
    }
    return [...swatches]
  })
  const [group] = useState(() => uuidv1())
  const colorTracked = useRef(false)
  const selectIcon = useCallback(
    (icon: string | null) =>
      dispatch(core.envelopes.setAppearance(id, { icon }, group)),
    [dispatch, id, group]
  )
  return (
    <PopoverSurface
      controller={controller}
      label={t('title')}
      anchor={anchor}
      finalFocus={() => anchor}
    >
      {tag && (
        <div data-picker-grids>
          <ColorPickerPanel
            value={tag.colorHEX}
            colors={palette}
            icon={<CategorySymbol symbol={tag.symbol} size="m" />}
            onChange={colorHex => {
              dispatch(core.envelopes.setAppearance(id, { colorHex }, group))
              if (!colorTracked.current) {
                track('envelope_color_changed', {})
                colorTracked.current = true
              }
            }}
          />
          <hr className="my-3 border-ui-border" />
          <IconGrid value={tag.icon} onChange={selectIcon} />
        </div>
      )}
    </PopoverSurface>
  )
}

/** Memoized: a colour drag re-renders the picker every frame. */
const IconGrid = memo(function IconGrid({
  value,
  onChange,
}: {
  value: string | null
  onChange: (icon: string | null) => void
}) {
  const { t, i18n } = useTranslation('colorPicker')
  const grid = usePickerGrid(selectableIcons.length)
  return (
    <div {...grid.gridProps} role="group" aria-label={t('icons')}>
      {selectableIcons.map(([icon, en, ru], index) => (
        <PickerGridButton
          key={icon}
          tabIndex={grid.tabIndex(index)}
          label={i18n.resolvedLanguage === 'ru' ? ru : en}
          aria-pressed={value === icon}
          className="text-ui-secondary aria-pressed:bg-ui-selected aria-pressed:text-ui-primary"
          onClick={() => onChange(value === icon ? null : icon)}
        >
          <CategorySymbol symbol={categoryIconById[icon]} className="size-7" />
        </PickerGridButton>
      ))}
    </div>
  )
})
