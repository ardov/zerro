import { useState, type ReactElement, type ReactNode } from 'react'
import type { usePopup } from '@/6-shared/overlays'
import type { MultiSelectProps } from './MultiSelect'
import { SelectSearch, type SelectSearchOptions } from './SelectSearch'
import { Field } from '@base-ui/react/field'
import { Select as Primitive } from '@base-ui/react/select'
import { ListPanel } from './ListPanel'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import type { SelectTriggerProps } from './SelectTrigger'
import {
  listPanelMargin,
  useListPanelPositioning,
} from './useListPanelPositioning'

import {
  useSelectField,
  selectPanelOutset as panelOutset,
} from './useSelectField'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  description?: ReactNode
  start?: ReactNode
  end?: ReactNode
  disabled?: boolean
  /** Additional terms used by searchable selects. */
  keywords?: readonly string[]
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
  /** Optional external control from usePopup(); OverlayHost owns visibility. */
  popup?: ReturnType<typeof usePopup>
  /** Align an existing selection; empty values, touch and tight spaces fall back. */
  alignSelected?: boolean
  showValueIcon?: boolean
  /** Custom button. For rich content, supply its accessible name explicitly. */
  trigger?: ReactElement
  renderValue?: (item: SelectOption<T> | undefined) => ReactNode
  emptyText?: string
  /** Search inside the popup; selected-row alignment applies only without search. */
  search?: boolean | SelectSearchOptions<T>
}

/** Internal modes share rendering while preserving the public value contracts. */
export type SelectControlProps<T extends string> =
  | (SelectProps<T> & { multiple?: false })
  | (MultiSelectProps<T> & { multiple: true; alignSelected?: never })

/** Controlled single selection. null represents an empty field. */
export function Select<T extends string>(props: SelectProps<T>) {
  return <SelectControl {...props} />
}

/** Internal dispatcher used by the single and multiple public controls. */
export function SelectControl<T extends string>(props: SelectControlProps<T>) {
  const { search, ...restProps } = props
  return search ? (
    <SelectSearch {...restProps} search={search === true ? {} : search} />
  ) : (
    <PlainSelect {...restProps} />
  )
}

function PlainSelect<T extends string>(props: SelectControlProps<T>) {
  const {
    value,
    items,
    label,
    size = 'lg',
    name,
    id,
    form,
    alignSelected = false,
    trigger,
    emptyText = 'No options',
    disabled,
    readOnly,
    required,
    invalid,
    error,
  } = props
  const {
    options,
    selected,
    reserveStart,
    open,
    setOpen,
    changeValue,
    surface,
    triggerProps,
    displayValue,
  } = useSelectField(props)
  const positioning = useListPanelPositioning()
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
      <Primitive.Root<T, boolean>
        multiple={props.multiple}
        value={value}
        onValueChange={changeValue}
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
          <Primitive.Trigger {...triggerProps} />
        ) : (
          <Primitive.Trigger {...triggerProps}>
            <Primitive.Value>{displayValue}</Primitive.Value>
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
