import type { ReactNode } from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './Toggle.css'

export type SwitchProps = Omit<
  SwitchPrimitive.Root.Props,
  'children' | 'className'
> & { className?: string }

export function Switch(props: SwitchProps) {
  const { className, ...restProps } = props
  return (
    <SwitchPrimitive.Root
      {...restProps}
      data-slot="switch"
      className={cn('kit-toggle kit-switch rounded-smooth', className)}
    >
      <SwitchPrimitive.Thumb className="kit-switch-thumb" aria-hidden />
    </SwitchPrimitive.Root>
  )
}

export type SwitchFieldProps = Omit<
  SwitchProps,
  'className' | 'render' | 'nativeButton'
> & {
  label: ReactNode
  /** Styles the label wrapper. */
  className?: string
}

export function SwitchField(props: SwitchFieldProps) {
  const { label, className, ...restProps } = props
  return (
    <label
      className={cn(
        'kit-toggle-label flex min-h-12 items-start gap-3 py-3 text-ui-16 text-ui-primary',
        restProps.disabled || restProps.readOnly
          ? 'cursor-default'
          : 'cursor-pointer',
        className
      )}
    >
      <Switch {...restProps} />
      <span
        className={cn('min-w-0', restProps.disabled && 'opacity-ui-disabled')}
      >
        {label}
      </span>
    </label>
  )
}
