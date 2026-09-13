import { useState, type ReactElement, type ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { Select as Primitive } from '@base-ui/react/select'
import { ListPanel } from './ListPanel'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import { SelectTrigger, type SelectTriggerProps } from './SelectTrigger'
import {
  listPanelMargin,
  useListPanelPositioning,
} from './useListPanelPositioning'

// Compensate for the panel's inner padding to align option and field text.
const panelOutset = 4

/** Whether an element already says what it is: content, or a name of its own. */
function isNamed(element: ReactElement) {
  const props = element.props as {
    children?: ReactNode
    'aria-label'?: string
    'aria-labelledby'?: string
    label?: ReactNode
  }
  return (
    props.children != null ||
    props['aria-label'] != null ||
    props['aria-labelledby'] != null ||
    props.label != null
  )
}

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  description?: ReactNode
  start?: ReactNode
  end?: ReactNode
  disabled?: boolean
}
export type SelectItem<T extends string = string> =
  | SelectOption<T>
  | {
      type: 'group'
      id: string
      label: string
      items: readonly SelectOption<T>[]
    }
  | {
      type: 'separator'
      id: string
    }
export type SelectProps<T extends string = string> = Pick<
  SelectTriggerProps,
  | 'label'
  | 'labelMode'
  | 'size'
  | 'placeholder'
  | 'required'
  | 'disabled'
  | 'readOnly'
  | 'description'
  | 'error'
  | 'invalid'
  | 'clearLabel'
  | 'className'
  | 'style'
  | 'ref'
> & {
  value: T | null
  onChange: (value: T | null) => void
  items: readonly SelectItem<T>[]
  name?: string
  id?: string
  form?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Align an existing selection; empty values, touch and tight spaces fall back. */
  alignSelected?: boolean
  showValueIcon?: boolean
  /** A button with its own layout; the select supplies popup semantics and events. */
  trigger?: ReactElement
  renderValue?: (item: SelectOption<T> | undefined) => ReactNode
  emptyText?: string
}

/** Controlled single selection. null represents an empty field. */
export function Select<T extends string>(props: SelectProps<T>) {
  const {
    value,
    onChange,
    items,
    label,
    size = 'lg',
    name,
    id,
    form,
    open: controlledOpen,
    onOpenChange,
    alignSelected = false,
    showValueIcon = true,
    trigger,
    renderValue,
    emptyText = 'No options',
    disabled,
    readOnly,
    required,
    invalid,
    error,
    ref,
    ...restProps
  } = props
  const [internalOpen, setInternalOpen] = useState(false)
  // The surface is state, not a ref: the alignment decision below is taken
  // while rendering the opening panel, and needs its geometry right then.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null)
  const positioning = useListPanelPositioning()
  const options = items.flatMap(item =>
    'type' in item ? (item.type === 'group' ? item.items : []) : [item]
  )
  const selected = options.find(item => item.value === value)
  const reserveStart = options.some(item => item.start != null)
  const unavailable = disabled || readOnly
  const open = !unavailable && (controlledOpen ?? internalOpen)
  const setOpen = (next: boolean) => {
    if (next && unavailable) return
    setInternalOpen(next)
    onOpenChange?.(next)
  }
  const canAlign = () => {
    // Native overlap positioning uses its own edge tolerances. Near viewport
    // edges (or a reduced visual viewport), use the boundary-aware positioner.
    // Alignment also needs clearance for the panel's full expansion.
    const clearance = listPanelMargin + 2 * panelOutset
    const rect = surface?.getBoundingClientRect()
    const viewport = positioning.collisionBoundary
    return Boolean(
      alignSelected &&
      selected != null &&
      !trigger &&
      rect &&
      rect.left >= (viewport?.x ?? 0) + clearance &&
      rect.right <=
        (viewport
          ? viewport.x + viewport.width
          : document.documentElement.clientWidth) -
          clearance &&
      (!viewport || viewport.height >= document.documentElement.clientHeight)
    )
  }
  // Decided as the panel opens, not in the change handler: the consumer may
  // control `open` directly, and then the handler never runs. The decision
  // survives closing, so the key below never remounts an exiting panel.
  const [alignment, setAlignment] = useState({ open: false, enabled: false })
  if (alignment.open !== open) {
    setAlignment({ open, enabled: open ? canAlign() : alignment.enabled })
  }
  const alignmentEnabled = alignment.enabled
  const renderOption = (item: SelectOption<T>) => (
    <Primitive.Item
      key={item.value}
      value={item.value}
      label={item.label}
      disabled={item.disabled}
      render={
        <ListRow
          size={size}
          start={item.start}
          end={item.end}
          description={item.description}
          reserveStart={reserveStart}
        />
      }
    >
      <Primitive.ItemText render={<span />}>{item.label}</Primitive.ItemText>
    </Primitive.Item>
  )

  return (
    <Field.Root
      invalid={invalid ?? (error ? true : undefined)}
      disabled={disabled}
    >
      <Primitive.Root<T>
        value={value}
        onValueChange={next => {
          if (!unavailable && !(required && next === null)) onChange(next)
        }}
        name={name}
        id={id}
        form={form}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        open={open}
        onOpenChange={setOpen}
      >
        {trigger ? (
          <Primitive.Trigger
            ref={ref}
            render={trigger}
            // A custom trigger renders its own content, and naming it from the
            // field label would drop that visible text out of the accessible
            // name (WCAG 2.5.3). Name it only when it has nothing to go on.
            aria-label={isNamed(trigger) ? undefined : label}
          />
        ) : (
          <Primitive.Trigger
            ref={ref}
            render={
              <SelectTrigger
                {...restProps}
                label={label}
                size={size}
                filled={value !== null}
                surfaceRef={setSurface}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                invalid={invalid}
                error={error}
                start={showValueIcon ? selected?.start : undefined}
                onClear={() => {
                  if (!unavailable && !required) onChange(null)
                }}
              />
            }
          >
            <Primitive.Value>
              {renderValue ? renderValue(selected) : (selected?.label ?? value)}
            </Primitive.Value>
          </Primitive.Trigger>
        )}
        <Primitive.Portal>
          <Primitive.Positioner
            // Base UI writes inline geometry in the aligned mode; remounting
            // the positioner is what clears it when the mode changes.
            key={alignmentEnabled ? 'aligned' : 'anchored'}
            {...positioning}
            anchor={trigger ? undefined : surface}
            alignOffset={trigger ? 0 : -panelOutset}
            alignItemWithTrigger={alignmentEnabled}
            className="z-popover"
            style={{
              ...positioning.style,
              // Aligned mode sizes itself from these margins rather than from
              // the collision padding, so they have to be the same number.
              ...(alignmentEnabled && { marginBlock: listPanelMargin }),
            }}
          >
            <Primitive.Popup
              render={
                <ListPanel
                  style={
                    trigger
                      ? undefined
                      : {
                          width: `calc(var(--anchor-width) + ${2 * panelOutset}px)`,
                        }
                  }
                  scrollRender={<Primitive.List aria-label={label} />}
                  empty={
                    options.length === 0 ? (
                      <p
                        role="status"
                        className="px-4 py-3 text-ui-14 text-ui-secondary"
                      >
                        {emptyText}
                      </p>
                    ) : undefined
                  }
                />
              }
            >
              {items.map(item => {
                if (!('type' in item)) return renderOption(item)
                if (item.type === 'separator')
                  return <ListRowSeparator key={item.id} />
                if (!item.items.length) return null
                return (
                  <Primitive.Group key={item.id}>
                    <Primitive.GroupLabel
                      render={<ListRowHeader size={size} />}
                    >
                      {item.label}
                    </Primitive.GroupLabel>
                    {item.items.map(renderOption)}
                  </Primitive.Group>
                )
              })}
            </Primitive.Popup>
          </Primitive.Positioner>
        </Primitive.Portal>
      </Primitive.Root>
    </Field.Root>
  )
}
