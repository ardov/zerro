import type { ComponentPropsWithRef } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from './shadcn/utils'

/** MUI dims a placeholder rather than recolouring it, and the two themes dim
 * it by different amounts. */
export const inputPlaceholderClass =
  'placeholder:text-current placeholder:opacity-[0.42] placeholder:disabled:opacity-disabled dark:placeholder:opacity-50'

export type GrowingTextareaProps = Omit<
  ComponentPropsWithRef<'input'>,
  'ref' | 'type' | 'size'
> & {
  maxRows?: number
}

/** A textarea that follows controlled content without measuring it in an
 * effect. The invisible copy and the control share a grid cell, so the copy
 * establishes the height and updates even when the value changes externally. */
export function GrowingTextarea({
  className,
  maxRows,
  ...props
}: GrowingTextareaProps) {
  const text = props.value ?? props.defaultValue ?? ''
  const cap = maxRows ? { maxHeight: `${maxRows}lh` } : undefined

  return (
    <div data-slot="textarea-sizer" className={cn(className, 'grid')}>
      <InputPrimitive
        {...props}
        render={<textarea rows={1} />}
        style={{ ...props.style, ...cap }}
        className={cn(
          'col-start-1 row-start-1 m-0 resize-none overflow-y-auto border-0 bg-transparent p-0 font-[family-name:inherit] text-[length:inherit] leading-[inherit] text-current outline-none disabled:text-disabled-foreground',
          inputPlaceholderClass
        )}
      />
      {/* The trailing space grows a finished line before its next character. */}
      <div
        aria-hidden
        style={cap}
        className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre-wrap"
      >{`${text} `}</div>
    </div>
  )
}
