import type { ReactNode } from 'react'
import { useId } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { popoverStack } from '6-shared/historyPopovers'
import { CheckIcon, ChevronDownIcon } from './Icons'
import { listRowClass } from './ListRow'
import { OutlinedFieldFrame, outlinedControlClass } from './OutlinedField'
import type { OutlinedFieldFrameProps, TFieldSize } from './OutlinedField'
import { overAnchor, popupPositioning, popupSurfaceClass } from './popupSurface'
import { cn } from './shadcn/utils'

/** One row of the list.
 *
 * `label` is the row's text and, through Base UI's `items`, what the closed
 * field shows. Reading it off the rendered rows instead would leave a closed
 * trigger showing the raw value, because the rows do not exist until the list
 * has been opened once. */
export type TSelectOption<T extends string> = {
  value: T
  label: string
  /** A second, muted line. Only the rows show it. */
  description?: ReactNode
}

/** Adornments are left out: the arrow already sits in that corner, and the
 * trigger is not an input for anything to sit beside. */
type TFieldProps = Omit<
  OutlinedFieldFrameProps,
  'startAdornment' | 'endAdornment'
> & {
  size?: TFieldSize
  'aria-label'?: string
}

export type SelectProps<T extends string> = TFieldProps & {
  value: T
  onChange: (value: T) => void
  options: TSelectOption<T>[]
}

export type MultiSelectProps<T extends string> = TFieldProps & {
  value: T[]
  onChange: (value: T[]) => void
  options: TSelectOption<T>[]
  /** What the closed field shows. Several values have no one label, so this is
   * the caller's summary — «3 tags» rather than a list. */
  renderValue: (value: T[]) => ReactNode
}

/** MUI's outlined `Select`.
 *
 * The trigger goes inside `OutlinedFieldFrame`, so the notched border and the
 * floating label are the ones the text field draws rather than a second copy.
 *
 * `options` is the whole list: rows are not written by hand, because every
 * select in the app has the same row — a label, sometimes a muted second line,
 * and a tick when it is the chosen one.
 *
 * `onChange` hands over the value, not an event. MUI's `Select` reports through
 * a synthetic event whose `target` has to be rebuilt by hand to carry `name`
 * and `value`, which is the shape form libraries read. Formik has
 * `setFieldValue` for exactly this. */
export function Select<T extends string>(props: SelectProps<T>) {
  const { value, onChange, options, ...field } = props
  const [open, onOpenChange] = useStackedOpen()
  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      // Base UI lets a select be cleared; no row here carries a null value.
      onValueChange={next => {
        if (next !== null) onChange(next)
      }}
      open={open}
      onOpenChange={onOpenChange}
    >
      <SelectField
        {...field}
        options={options}
        display={<SelectPrimitive.Value />}
      />
    </SelectPrimitive.Root>
  )
}

/** The same control with more than one value selected, which is the tag
 * picker. Picking does not close the list, and the closed field needs a
 * summary of its own. */
export function MultiSelect<T extends string>(props: MultiSelectProps<T>) {
  const { value, onChange, options, renderValue, ...field } = props
  const [open, onOpenChange] = useStackedOpen()
  return (
    <SelectPrimitive.Root
      multiple
      items={options}
      value={value}
      onValueChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
    >
      <SelectField {...field} options={options} display={renderValue(value)} />
    </SelectPrimitive.Root>
  )
}

/** Puts the open list on the popover stack, so Back closes it rather than
 * leaving the page. Every select wants that and none of them is opened by
 * name, so the key is generated instead of being asked for at the call site —
 * all the stack needs is that no two live selects share one. */
function useStackedOpen(): [boolean, (open: boolean) => void] {
  const key = useId()
  const [open, onOpen, onClose] = popoverStack.usePopoverState(key)
  return [open, next => (next ? onOpen() : onClose())]
}

function SelectField<T extends string>({
  options,
  display,
  size = 'medium',
  'aria-label': ariaLabel,
  ...frame
}: TFieldProps & { options: TSelectOption<T>[]; display: ReactNode }) {
  return (
    <>
      {/* The trigger is not a `Field.Control`, so nothing tells the frame the
          field is filled — but a select always shows a value. */}
      <OutlinedFieldFrame {...frame} size={size} shrink>
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
          {...popupPositioning}
          side="bottom"
          align="start"
          sideOffset={overAnchor}
          // The list is as wide as the field it drops out of, the way MUI's is.
          style={{ minWidth: 'var(--anchor-width)' }}
        >
          {/* A list grows less than a menu: it opens over the field, so a
              deeper scale reads as the field jumping. */}
          <SelectPrimitive.Popup
            className={cn(popupSurfaceClass, '[--grow-from:0.95]')}
          >
            {options.map(option => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                data-slot="select-item"
                className={listRowClass}
              >
                {/* Base UI aligns the chosen row's text with the trigger's,
                    and takes that measurement from `ItemText`. */}
                <SelectPrimitive.ItemText className="min-w-0 flex-auto">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block type-body-sm text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-4 inline-flex shrink-0 items-center text-primary">
                  <CheckIcon fontSize="small" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </>
  )
}
