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
 * A mirror of the text shares one grid cell with the input, so the cell is
 * the text's width and the input stretches to it. No measurement, no effect,
 * no layout pass out of step with the keystroke that caused it.
 *
 * This is what lets an amount stay optically centred, or sit right against
 * the currency code beside it — a full-width input would put the text in the
 * middle of a box that is not the text. */
export function AutoWidthInput({
  measure,
  className,
  inputClassName,
  ...props
}: AutoWidthInputProps) {
  const text = measure ?? String(props.value ?? '')
  return (
    <span className={cn('grid min-w-0 justify-items-start', className)}>
      <input
        // An input's intrinsic width comes from `size`, and the default 20
        // characters would set the grid track rather than the text does.
        size={1}
        {...props}
        className={cn(
          'col-start-1 row-start-1 m-0 w-full min-w-4 border-0 bg-transparent p-0 font-[family-name:inherit] text-[length:inherit] leading-[inherit] font-[inherit] text-current outline-none disabled:text-disabled-foreground',
          inputClassName
        )}
      />
      {/* A sliver wider than the text, so a caret at its end is not clipped.
          A whole trailing space would be a visible gap at display sizes. */}
      <span
        aria-hidden
        className="col-start-1 row-start-1 invisible pr-0.5 whitespace-pre"
      >
        {text || props.placeholder || '0'}
      </span>
    </span>
  )
}
