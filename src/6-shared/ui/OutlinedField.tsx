import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from './shadcn/utils'
import { GrowingTextarea, inputPlaceholderClass } from './GrowingTextarea'
import './OutlinedField.css'

/** legacy UI's two outlined heights. They are the control's padding and nothing
 * else — the notch, the label and the helper text are the same either way,
 * which is why the frame does not take this. */
export type TFieldSize = 'small' | 'medium'

export type OutlinedFieldFrameProps = {
  label?: ReactNode
  helperText?: ReactNode
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  fullWidth?: boolean
  /** Which of legacy UI's two heights this is. The frame needs it because a label
   * that is not floated rests on the control's padding. */
  size?: TFieldSize
  /** Keeps the label floated whatever the control is doing. Base UI reports a
   * field filled from its `Field.Control`, and a select's trigger is not one,
   * so the select says so itself. */
  shrink?: boolean
  error?: boolean
  disabled?: boolean
  className?: string
}

export type OutlinedFieldProps = Omit<ComponentPropsWithRef<'input'>, 'size'> &
  Omit<OutlinedFieldFrameProps, 'disabled'> & {
    /** legacy UI's `multiline`: a textarea that grows with what is typed into it. */
    multiline?: boolean
    /** How many lines it may grow to before it scrolls. */
    maxRows?: number
  }

/** The padding legacy UI gives the control inside an outlined field. The adornments
 * sit outside it, so whichever side carries one loses its padding here and the
 * group takes it instead.
 *
 * Each edge names exactly one class rather than an `px-*` that a later `pl-0`
 * has to beat: which of the two wins is Tailwind's emission order, not the
 * order they are written in. */
export function outlinedControlClass(opts: {
  size?: TFieldSize
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  /** A select keeps room for its arrow, which sits over the control. */
  trailingIcon?: boolean
}) {
  return cn(
    'm-0 block w-full min-w-0 box-content border-0 bg-transparent font-[family-name:inherit] text-[length:inherit] leading-[inherit] text-current outline-none disabled:text-disabled-foreground',
    opts.startAdornment ? 'pl-0' : 'pl-3.5',
    opts.trailingIcon ? 'pr-8' : opts.endAdornment ? 'pr-0' : 'pr-3.5',
    opts.size === 'small' ? 'py-[8.5px]' : 'py-[16.5px]'
  )
}

/** The notched border, the floating label and the helper text, with no opinion
 * about what sits inside. `OutlinedField` puts an input there and `Select` puts
 * a trigger, so the notch geometry is written once. */
export function OutlinedFieldFrame({
  className,
  label,
  helperText,
  startAdornment,
  endAdornment,
  fullWidth,
  size = 'medium',
  shrink,
  error = false,
  disabled,
  children,
}: OutlinedFieldFrameProps & { children: ReactNode }) {
  return (
    <Field.Root
      invalid={error}
      disabled={disabled}
      // Both of these are read by the stylesheet, which is where the label's
      // two positions live. `data-focused` and `data-filled` come from Base UI
      // on this same element, so the label reads all four from one place.
      data-size={size}
      data-shrink={shrink || undefined}
      className={cn(
        'inline-flex min-w-0 flex-col align-top',
        fullWidth && 'w-full',
        className
      )}
    >
      <div
        data-slot="input-group"
        className={cn(
          'outlined-field__group relative inline-flex min-w-0 items-center rounded-lg font-sans text-base leading-[23px] text-foreground',
          startAdornment && 'pl-3.5',
          endAdornment && 'pr-3.5'
        )}
      >
        {label && (
          <Field.Label className="outlined-field__label pointer-events-none absolute top-0 left-0 origin-top-left">
            {label}
          </Field.Label>
        )}
        {startAdornment && (
          <span className="mr-2 inline-flex shrink-0 items-center whitespace-nowrap text-muted-foreground">
            {startAdornment}
          </span>
        )}
        {children}
        {endAdornment && (
          <span className="ml-2 inline-flex shrink-0 items-center whitespace-nowrap text-muted-foreground">
            {endAdornment}
          </span>
        )}
        <fieldset
          aria-hidden="true"
          className="outlined-field__notch pointer-events-none absolute inset-0 -top-[5px] m-0 min-w-0 rounded-[inherit] px-2"
        >
          <legend
            className={cn(
              'invisible block h-[11px] overflow-hidden p-0 text-xs leading-[11px] whitespace-nowrap',
              !label && 'w-0'
            )}
          >
            <span className="inline-block px-[5px]">{label || '\u200b'}</span>
          </legend>
        </fieldset>
      </div>
      {helperText && (
        <Field.Description
          className={cn(
            'mx-3.5 mt-[3px] mb-0 type-caption text-muted-foreground',
            error && 'text-error'
          )}
        >
          {helperText}
        </Field.Description>
      )}
    </Field.Root>
  )
}

/** legacy UI's outlined text field: a notched border with the label cut into it.
 *
 * The label rests inside the field and floats up into the notch once the field
 * is focused or filled, which is what legacy UI calls shrinking. Base UI's
 * `Field.Root` reports both states as data attributes, so the two positions
 * are a stylesheet rule rather than React state.
 *
 * `Field.Root` supplies the label/description wiring and the `data-invalid` /
 * `data-disabled` state the stylesheet keys off, so none of it is spelled out
 * by hand. Native props target the input; `className` sizes the field group. */
export function OutlinedField({
  className,
  label,
  helperText,
  startAdornment,
  endAdornment,
  fullWidth,
  size = 'medium',
  error = false,
  disabled,
  multiline,
  maxRows,
  ...props
}: OutlinedFieldProps) {
  const controlClass = outlinedControlClass({
    size,
    startAdornment,
    endAdornment,
  })
  return (
    <OutlinedFieldFrame
      className={className}
      label={label}
      helperText={helperText}
      startAdornment={startAdornment}
      endAdornment={endAdornment}
      fullWidth={fullWidth}
      size={size}
      error={error}
      disabled={disabled}
    >
      {multiline ? (
        <GrowingTextarea
          {...props}
          className={controlClass}
          maxRows={maxRows}
        />
      ) : (
        <InputPrimitive
          {...props}
          className={cn(controlClass, inputPlaceholderClass)}
        />
      )}
    </OutlinedFieldFrame>
  )
}
