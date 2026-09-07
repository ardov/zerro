import type { ComponentPropsWithRef } from 'react'
import { cn } from './shadcn/utils'

export type AutoWidthInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size'
> & {
  /** What to measure. Defaults to the input's own value, and differs from it
   * only when an empty field should still reserve room for something. */
  measure?: string
  /** Sizes the wrapper; the input fills it. */
  className?: string
  /** Goes on the input itself — its alignment, mostly. */
  inputClassName?: string
}

/** An input exactly as wide as its text.
 *
 * A mirror of the text sits in the flow and the input lies over it, so the
 * box is the text's width and nothing else. No measurement, no effect, no
 * layout pass out of step with the keystroke that caused it.
 *
 * The input is taken out of the flow on purpose. An input carries an
 * intrinsic width of its own — a `size` in characters, which at display sizes
 * is wider than a short amount — and in the flow that width, not the text,
 * would decide the box. A single `0` would then sit in a box half as wide
 * again as itself, pushed away from the sign beside it.
 *
 * This is what lets an amount stay optically centred, or sit right against
 * the currency code beside it. */
export function AutoWidthInput({
  measure,
  className,
  inputClassName,
  ...props
}: AutoWidthInputProps) {
  const text = measure ?? String(props.value ?? '')
  return (
    <span className={cn('relative inline-block min-w-0', className)}>
      {/* One trailing sliver, so a caret at the end of the text is not
          clipped. The mirror is what the box is measured from, so it falls
          back to the placeholder when there is nothing typed. */}
      <span aria-hidden className="invisible block pr-0.5 whitespace-pre">
        {text || props.placeholder || '0'}
      </span>
      <input
        {...props}
        className={cn(
          'absolute inset-0 m-0 w-full border-0 bg-transparent p-0 font-[family-name:inherit] text-[length:inherit] leading-[inherit] font-[inherit] text-current outline-none disabled:text-disabled-foreground',
          inputClassName
        )}
      />
    </span>
  )
}
