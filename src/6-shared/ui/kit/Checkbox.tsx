import type { ReactNode } from 'react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { ToggleLabel } from './ToggleLabel'
import './Toggle.css'

export type CheckboxProps = Omit<
  CheckboxPrimitive.Root.Props,
  'children' | 'className' | 'parent'
> & { className?: string }

export function Checkbox(props: CheckboxProps) {
  const { className, ...restProps } = props
  return (
    <CheckboxPrimitive.Root
      {...restProps}
      data-slot="checkbox"
      className={cn('kit-toggle kit-checkbox rounded-smooth', className)}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="kit-checkbox-indicator"
        aria-hidden
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="kit-checkbox-check" d="m5 10 3.2 3.2L15 6.5" />
          <path className="kit-checkbox-mixed" d="M5 10h10" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export type CheckboxFieldProps = Omit<
  CheckboxProps,
  'className' | 'render' | 'nativeButton'
> & {
  label: ReactNode
  /** Styles the label wrapper. */
  className?: string
}

export function CheckboxField(props: CheckboxFieldProps) {
  const { label, className, ...restProps } = props
  return (
    <ToggleLabel
      label={label}
      disabled={restProps.disabled}
      readOnly={restProps.readOnly}
      className={className}
    >
      <Checkbox {...restProps} className="my-0.5" />
    </ToggleLabel>
  )
}
