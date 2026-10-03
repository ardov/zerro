import {
  useImperativeHandle,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { focusControlOnPress } from './Field'
import { InputWidth } from './InputWidth'

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
      <InputWidth value={value} placeholder={props.placeholder}>
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
          className="m-0 w-full rounded-ui-control-inner border-0 bg-transparent p-0 text-[length:inherit] leading-[inherit] font-[inherit] tracking-[inherit] text-current outline-none placeholder:text-ui-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:text-current"
        />
      </InputWidth>
      {end != null && (
        <span className="shrink-0" inert={disabled || undefined}>
          {end}
        </span>
      )}
    </span>
  )
}
