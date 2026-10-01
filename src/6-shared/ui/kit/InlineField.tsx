import {
  useImperativeHandle,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { focusControlOnPress } from './Field'

export type InlineFieldProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue' | 'children'
> & {
  label: string
  value: string
  /** Reports the text after the native onChange handler. */
  onValueChange?: (value: string) => void
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
  onChange,
  onValueChange,
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
      <span className="relative inline-block min-w-0 max-w-full shrink">
        {/* The mirror measures the text; trailing space keeps the caret visible. */}
        <span
          aria-hidden
          className="invisible block overflow-hidden pr-0.5 whitespace-pre"
        >
          {value || props.placeholder || ' '}
        </span>
        <InputPrimitive
          {...props}
          onChange={event => {
            const value = event.currentTarget.value
            onChange?.(event)
            onValueChange?.(value)
          }}
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          aria-label={props['aria-label'] ?? label}
          aria-invalid={invalid || props['aria-invalid']}
          className="absolute inset-0 m-0 w-full rounded-ui-control-inner border-0 bg-transparent p-0 text-[length:inherit] leading-[inherit] font-[inherit] tracking-[inherit] text-current outline-none placeholder:text-ui-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:text-current"
        />
      </span>
      {end != null && (
        <span className="shrink-0" inert={disabled || undefined}>
          {end}
        </span>
      )}
    </span>
  )
}
