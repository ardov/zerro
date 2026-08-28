import type { ReactNode } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { popoverStack } from '6-shared/historyPopovers'
import { CheckIcon, ChevronDownIcon } from './feather'
import { listRowClass } from './ListRow'
import { OutlinedFieldFrame, outlinedControlClass } from './OutlinedField'
import type { OutlinedFieldFrameProps } from './OutlinedField'
import { cn } from './shadcn/utils'
import './Select.css'

type TCommonProps = OutlinedFieldFrameProps & {
  /** Puts the open list on the popover stack, so Back closes it rather than
   * leaving the page. Every select in the app wants this; it is a prop only
   * because the key has to be unique. */
  elKey: string
  /** The options, as value to label.
   *
   * Base UI resolves a row's label from its `SelectItemText`, which does not
   * exist until the list has been opened once — so a closed trigger shows the
   * raw value without this. It also renders the rows when no `children` are
   * given, which is every select whose rows are just a label.
   */
  items?: Record<string, ReactNode>
  children?: ReactNode
  'aria-label'?: string
}

export type SelectProps<T> = TCommonProps & {
  value: T
  onChange: (value: T) => void
  /** What the closed trigger shows. Defaults to the selected item's label. */
  renderValue?: (value: T) => ReactNode
}

export type MultiSelectProps<T> = TCommonProps & {
  value: T[]
  onChange: (value: T[]) => void
  renderValue?: (value: T[]) => ReactNode
}

/** MUI's outlined `Select`.
 *
 * The trigger reuses `OutlinedFieldFrame`, so the notched border and floating
 * label are the same ones the text field draws rather than a second copy.
 *
 * `onChange` takes the value, not an event. MUI's `Select` reports through a
 * synthetic event whose `target` has to be rebuilt by hand to carry `name` and
 * `value` — the shape form libraries read. Formik has `setFieldValue` for
 * exactly this, so the value goes straight to the caller. */
export function Select<T extends string>(props: SelectProps<T>) {
  const { value, onChange, renderValue, ...rest } = props
  return (
    <SelectBase
      {...rest}
      value={value}
      onValueChange={next => onChange(next as T)}
      display={renderValue ? renderValue(value) : <SelectPrimitive.Value />}
    />
  )
}

/** The same control with more than one value selected, which is the tag
 * picker. Its rows carry their own checkbox, so the tick the single select
 * shows would be a second, redundant mark. */
export function MultiSelect<T extends string>(props: MultiSelectProps<T>) {
  const { value, onChange, renderValue, ...rest } = props
  return (
    <SelectBase
      {...rest}
      multiple
      value={value}
      onValueChange={next => onChange(next as T[])}
      display={renderValue ? renderValue(value) : <SelectPrimitive.Value />}
    />
  )
}

function SelectBase({
  elKey,
  items,
  value,
  onValueChange,
  multiple,
  display,
  children,
  className,
  label,
  helperText,
  fullWidth,
  size = 'medium',
  error,
  disabled,
  'aria-label': ariaLabel,
}: TCommonProps & {
  value: unknown
  onValueChange: (value: never) => void
  multiple?: boolean
  display: ReactNode
}) {
  const [open, onOpen, onClose] = popoverStack.usePopoverState(elKey)
  const rows =
    children ??
    Object.entries(items ?? {}).map(([itemValue, label]) => (
      <SelectItem key={itemValue} value={itemValue}>
        <SelectItemText>{label}</SelectItemText>
        <SelectItemCheck />
      </SelectItem>
    ))
  return (
    <SelectPrimitive.Root
      // Base UI types the value against `multiple`; the public API above is
      // what keeps the two shapes honest.
      {...({ value, onValueChange, multiple, items } as any)}
      open={open}
      onOpenChange={next => (next ? onOpen() : onClose())}
    >
      <OutlinedFieldFrame
        className={className}
        label={label}
        helperText={helperText}
        fullWidth={fullWidth}
        size={size}
        error={error}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          aria-label={ariaLabel}
          className={cn(
            outlinedControlClass({ size, trailingIcon: true }),
            'flex cursor-pointer items-center text-left'
          )}
        >
          <span className="min-w-0 flex-auto truncate">{display}</span>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Icon className="pointer-events-none absolute right-[7px] inline-flex text-action-active">
          <ChevronDownIcon />
        </SelectPrimitive.Icon>
      </OutlinedFieldFrame>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={({ anchor }) => -anchor.height}
          collisionPadding={16}
          arrowPadding={0}
          positionMethod="fixed"
          className="z-modal"
          // The list is as wide as the field it drops out of, the way MUI's is.
          style={{ minWidth: 'var(--anchor-width)' }}
        >
          <SelectPrimitive.Popup className="owned-select max-h-[calc(100dvh-96px)] overflow-y-auto rounded-lg bg-popover py-2 text-popover-foreground shadow-elevation-8 outline-none">
            {rows}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: Omit<SelectPrimitive.Item.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(listRowClass, className)}
      {...props}
    >
      {children}
    </SelectPrimitive.Item>
  )
}

/** The row's label. Base UI reads the closed trigger's text from here, so a
 * row that renders its label directly shows the raw value instead. */
export function SelectItemText({
  className,
  ...props
}: Omit<SelectPrimitive.ItemText.Props, 'className'> & {
  className?: string
}) {
  return (
    <SelectPrimitive.ItemText
      className={cn('min-w-0 flex-auto truncate', className)}
      {...props}
    />
  )
}

/** The tick MUI puts against the chosen row. Left out where the row already
 * carries a checkbox. */
export function SelectItemCheck() {
  return (
    <SelectPrimitive.ItemIndicator className="ml-4 inline-flex shrink-0 items-center text-primary">
      <CheckIcon fontSize="small" />
    </SelectPrimitive.ItemIndicator>
  )
}
