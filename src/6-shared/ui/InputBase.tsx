import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { GrowingTextarea, inputPlaceholderClass } from './GrowingTextarea'
import { cn } from './shadcn/utils'

export type InputBaseProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'children' | 'ref'
> & {
  /** MUI's `multiline`, which swapped the `input` for a `textarea`. */
  multiline?: boolean
  /** MUI's `startAdornment`, which is a label rather than a decoration here:
   * clicking it focuses the field. */
  startAdornment?: ReactNode
  className?: string
}

/** MUI's `InputBase`: a field with none of the decoration `OutlinedField`
 * brings — no border, no notch, no label — for the two places that draw their
 * own surface around it.
 *
 * `className` sizes that surface, which is what MUI's `sx` on the root did;
 * the control inside keeps the type and the 4px/5px MUI gives it. */
export function InputBase({
  multiline,
  startAdornment,
  className,
  ...props
}: InputBaseProps) {
  const control = cn(
    // `font: inherit` rather than a family and a size: a bare input starts
    // from the browser's own 13.33px, and every measurement below it — the
    // 1.4375em height most of all — is a multiple of the size it inherits.
    'm-0 box-content block w-full min-w-0 border-0 bg-transparent p-0 pt-1 pb-[5px] text-current outline-0 [font:inherit]',
    inputPlaceholderClass
  )
  const content = (
    <>
      {startAdornment && (
        <span className="mr-2 flex shrink-0 items-center text-muted-foreground">
          {startAdornment}
        </span>
      )}
      {multiline ? (
        <GrowingTextarea className={control} {...props} />
      ) : (
        <InputPrimitive className={cn(control, 'h-[1.4375em]')} {...props} />
      )}
    </>
  )
  const rootClassName = cn(
    // `type-body` would be 16px on a 24px line; MUI's field is 16px on
    // 1.4375em, which is the 23px every height under it is measured from.
    'relative inline-flex cursor-text items-center font-sans text-base leading-[1.4375] font-normal text-foreground',
    className
  )

  return startAdornment ? (
    <label data-slot="input-base" className={rootClassName}>
      {content}
    </label>
  ) : (
    <div data-slot="input-base" className={rootClassName}>
      {content}
    </div>
  )
}
