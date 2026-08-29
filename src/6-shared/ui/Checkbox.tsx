import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { cn } from './shadcn/utils'

export type CheckboxProps = Omit<
  CheckboxPrimitive.Root.Props,
  'className' | 'render'
> & { className?: string }

/** A 24px glyph in a round 42px hit area, unfilled until it
 * is checked and in the primary colour once it is.
 *
 * The glyph is drawn here rather than imported. It is the control's own
 * artwork — two solid checkbox shapes, an empty box and a box with a tick — and it
 * is not an icon anything else asks for. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'relative box-border inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[50%] border-0 bg-transparent p-[9px] text-muted-foreground outline-0 transition-colors duration-150 ease-in-out',
        'hover:bg-primary-hover data-checked:text-primary',
        'disabled:pointer-events-none disabled:text-action-disabled',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="block size-6 fill-current"
        render={<Glyph />}
      />
    </CheckboxPrimitive.Root>
  )
}

/** The two solid checkbox shapes. The ticked one is not the
 * empty one with a tick laid over it — it is a filled box with the tick cut
 * out of it — so they are two paths and only one is ever shown. Which one is
 * decided by the `data-checked` Base UI puts on the indicator around them. */
function Glyph(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <path
        className="[[data-checked]>&]:hidden"
        d="M19 5v14H5V5zm0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2"
      />
      <path
        className="[[data-unchecked]>&]:hidden"
        d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2m-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"
      />
    </svg>
  )
}

export type CheckboxFieldProps = Omit<CheckboxProps, 'className'> & {
  label: ReactNode
  className?: string
}

/** A labeled checkbox. The control's padding is pulled 11px off the left edge
 * so the glyph lines up with the text above it. */
export function CheckboxField({
  label,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <label
      data-slot="checkbox-field"
      className={cn(
        'inline-flex cursor-pointer items-center align-middle -ml-[11px] mr-4 font-sans type-body [-webkit-tap-highlight-color:transparent]',
        className
      )}
    >
      <Checkbox {...props} />
      {label}
    </label>
  )
}
