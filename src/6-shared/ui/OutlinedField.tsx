import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from './shadcn/utils'
import './OutlinedField.css'

export type OutlinedFieldProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size'
> & {
  label?: ReactNode
  helperText?: ReactNode
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  fullWidth?: boolean
  size?: 'small' | 'medium'
  error?: boolean
}

/** MUI's outlined text field: a notched border with the label cut into it.
 *
 * The label is always floated. MUI drops an outlined label into the field
 * until it is focused or filled, and that mode is not implemented here
 * because nothing needs it yet — every converted field always holds a value.
 * A field that can be empty needs that mode added to this component, not a
 * second copy of the notch geometry.
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
  ...props
}: OutlinedFieldProps) {
  return (
    <Field.Root
      invalid={error}
      disabled={disabled}
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
          <Field.Label className="outlined-field__label pointer-events-none absolute top-0 left-0 origin-top-left translate-x-3.5 -translate-y-[9px] scale-75">
            {label}
          </Field.Label>
        )}
        {startAdornment && (
          <span className="mr-2 inline-flex shrink-0 items-center whitespace-nowrap text-muted-foreground">
            {startAdornment}
          </span>
        )}
        <InputPrimitive
          {...props}
          className={cn(
            'm-0 block w-full min-w-0 box-content border-0 bg-transparent px-3.5 font-[family-name:inherit] text-[length:inherit] leading-[inherit] text-current outline-none placeholder:text-current placeholder:opacity-[0.42] disabled:text-disabled-foreground dark:placeholder:opacity-50',
            startAdornment && 'pl-0',
            endAdornment && 'pr-0',
            size === 'small' ? 'py-[8.5px]' : 'py-[16.5px]'
          )}
        />
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
