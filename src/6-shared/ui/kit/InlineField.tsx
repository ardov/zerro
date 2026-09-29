import {
  useImperativeHandle,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { AutoWidthInput } from '../AutoWidthInput'
import { focusControlOnPress } from './Field'

export type InlineFieldProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue' | 'children'
> & {
  label: string
  value: string
  invalid?: boolean
  start?: ReactNode
  end?: ReactNode
}

/** A controlled text input that inherits typography and grows within the
 * available width. Its caller owns saving, cancellation and error feedback. */
export function InlineField({
  label,
  value,
  invalid,
  start,
  end,
  className,
  style,
  ref,
  disabled,
  ...props
}: InlineFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current!)
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-baseline gap-1 align-baseline',
        disabled && 'opacity-ui-disabled',
        className
      )}
      style={style}
      onMouseDown={event => {
        if (!disabled) focusControlOnPress(event, inputRef.current)
      }}
    >
      {start != null && (
        <span className="shrink-0" inert={disabled || undefined}>
          {start}
        </span>
      )}
      <AutoWidthInput
        {...props}
        ref={inputRef}
        type="text"
        value={value}
        measure={value || props.placeholder || ' '}
        disabled={disabled}
        aria-label={props['aria-label'] ?? label}
        aria-invalid={invalid ?? props['aria-invalid']}
        className="max-w-full shrink"
        inputClassName="rounded-ui-control-inner tracking-[inherit] placeholder:text-ui-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:text-current"
      />
      {end != null && (
        <span className="shrink-0" inert={disabled || undefined}>
          {end}
        </span>
      )}
    </span>
  )
}
