import { useState } from 'react'
import type { SelectItem, SelectProps } from './Select'
import { SelectTrigger, isNamedSelectTrigger } from './SelectTrigger'

// Compensate for the panel padding so option and field text line up.
export const selectPanelOutset = 4

export function flattenSelectItems<T extends string>(
  items: readonly SelectItem<T>[]
) {
  return items.flatMap(item =>
    'type' in item ? (item.type === 'group' ? item.items : []) : [item]
  )
}

/** Shared field rules; each primitive owns its popup and keyboard behavior. */
export function useSelectField<T extends string>(props: SelectProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false)
  // Alignment needs geometry during the render that opens the panel.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null)
  const options = flattenSelectItems(props.items)
  const selected = options.find(item => item.value === props.value)
  const reserveStart = options.some(item => item.start != null)
  const unavailable = props.disabled || props.readOnly
  const open = !unavailable && (props.open ?? internalOpen)
  const setOpen = (next: boolean) => {
    if (next && unavailable) return
    setInternalOpen(next)
    props.onOpenChange?.(next)
  }
  const changeValue = (next: T | null) => {
    if (!unavailable && !(props.required && next === null)) props.onChange(next)
  }
  const triggerProps = {
    ref: props.ref,
    // Preserve a custom trigger's visible name, supplying a fallback only.
    'aria-label':
      props.trigger && !isNamedSelectTrigger(props.trigger)
        ? props.label
        : undefined,
    render: props.trigger ?? (
      <SelectTrigger
        label={props.label}
        labelMode={props.labelMode}
        size={props.size}
        placeholder={props.placeholder}
        description={props.description}
        clearLabel={props.clearLabel}
        className={props.className}
        style={props.style}
        filled={props.value !== null}
        surfaceRef={setSurface}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={props.invalid}
        error={props.error}
        start={props.showValueIcon !== false ? selected?.start : undefined}
        onClear={() => changeValue(null)}
      />
    ),
  }
  const displayValue = props.trigger
    ? undefined
    : props.renderValue
      ? props.renderValue(selected)
      : (selected?.label ?? props.value)

  return {
    options,
    selected,
    reserveStart,
    open,
    setOpen,
    changeValue,
    surface,
    triggerProps,
    displayValue,
  }
}
