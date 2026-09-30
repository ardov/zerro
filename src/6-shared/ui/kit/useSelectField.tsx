import { useMemo, useState, type CSSProperties } from 'react'
import { useOwnedPopup } from './useOwnedPopup'
import type { SelectItem, SelectOption, SelectControlProps } from './Select'
import { SelectTrigger, getSelectTriggerLabel } from './SelectTrigger'
import { ListRow } from './ListRow'

// Compensate for the panel padding so option and field text line up.
export const selectPanelOutset = 4

export function flattenSelectItems<T extends string>(
  items: readonly SelectItem<T>[]
) {
  return items.flatMap(item =>
    'type' in item ? (item.type === 'group' ? item.items : []) : [item]
  )
}

/** Option rows select on their own click. Releasing the press that opened the
 * popup must not select an option appearing beneath a stationary pointer. */
export function preventMouseUpSelection(event: {
  preventBaseUIHandler: () => void
}) {
  event.preventBaseUIHandler()
}

/** Shared field rules; each primitive owns its popup and keyboard behavior. */
export function useSelectField<T extends string>(props: SelectControlProps<T>) {
  const size = props.size ?? 'lg'
  // Alignment needs geometry during the render that opens the panel.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null)
  const options = useMemo(() => flattenSelectItems(props.items), [props.items])
  const values = props.multiple
    ? props.value
    : props.value === null
      ? []
      : [props.value]
  const selectedItems = values.flatMap(value => {
    const option = options.find(item => item.value === value)
    return option ? [option] : []
  })
  const selected = values.length === 1 ? selectedItems[0] : undefined
  const valueIcon = values.length === 0 ? props.emptyIcon : selected?.start
  const reserveStart = options.some(item => item.start != null)
  const unavailable = props.disabled || props.readOnly
  const { open, setOpen } = useOwnedPopup({ popup: props.popup, unavailable })
  const changeValue = (next: T | T[] | null) => {
    if (unavailable) return
    if (props.multiple) {
      if (Array.isArray(next) && !(props.required && next.length === 0))
        props.onChange(next)
    } else if (!Array.isArray(next) && !(props.required && next === null)) {
      props.onChange(next)
    }
  }
  const triggerProps = {
    ref: props.ref,
    'aria-label': props.trigger
      ? getSelectTriggerLabel(props.trigger, props.label)
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
        filled={values.length > 0}
        surfaceRef={setSurface}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        invalid={props.invalid}
        error={props.error}
        start={props.showValueIcon === false ? undefined : valueIcon}
        onClear={() => changeValue(props.multiple ? [] : null)}
      />
    ),
  }
  const displayValue = props.trigger
    ? undefined
    : props.multiple
      ? props.renderValue
        ? props.renderValue(selectedItems)
        : values.length > 1
          ? (props.selectionLabel?.(values.length) ??
            `Selected: ${values.length}`)
          : (selected?.label ?? values[0])
      : props.renderValue
        ? props.renderValue(selected)
        : (selected?.label ?? props.value)

  return {
    size,
    options,
    selected,
    reserveStart,
    open,
    setOpen,
    changeValue,
    surface,
    fieldProps: {
      className: props.trigger ? 'min-w-0 max-w-full' : undefined,
      invalid: props.invalid ?? (props.error ? true : undefined),
      disabled: props.disabled,
    },
    triggerProps,
    displayValue,
    /** The row an option renders into, whichever primitive owns the option. */
    optionRow: (item: SelectOption<T>) => (
      <ListRow
        className="[&+[role=option]]:mt-px"
        size={size}
        indent={item.indent}
        start={item.start}
        end={item.end}
        description={item.description}
        reserveStart={reserveStart}
      />
    ),
    /** Shown above the list, so it is never announced as an option. */
    emptyNotice: (shownCount: number) =>
      shownCount === 0 ? (
        <p role="status" className="px-4 py-3 text-ui-14 text-ui-secondary">
          {props.emptyText ?? 'No options'}
        </p>
      ) : undefined,
    popupStyle: {
      width: 'max-content',
      minWidth: `min(var(--available-width, calc(100dvw - var(--list-panel-margin, 16px) * 2)), max(calc(var(--anchor-width) + ${2 * selectPanelOutset}px), ${typeof props.popupMinWidth === 'number' ? `${props.popupMinWidth}px` : (props.popupMinWidth ?? '0px')}))`,
    } satisfies CSSProperties,
  }
}
