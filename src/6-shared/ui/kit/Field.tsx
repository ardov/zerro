import type {
  ComponentPropsWithRef,
  CSSProperties,
  ReactNode,
  RefObject,
} from 'react'
import { useId } from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cva } from 'class-variance-authority'
import { cn } from '@/6-shared/ui/shadcn/utils'

const surfaceVariants = cva(
  [
    // Layout and typography
    'relative flex min-h-12 w-full items-center rounded-ui-control text-ui-16 text-ui-primary',
    // Surface and interaction
    'border-0 bg-ui-highlight inset-ring-(length:--stroke-ui-control) inset-ring-transparent',
    'hover:not-focus-within:inset-ring-ui-border focus-within:inset-ring-ui-focus focus-within:bg-ui-card',
    'transition-colors duration-150 motion-reduce:transition-none',
    // Validation and availability
    'data-invalid:focus-within:inset-ring-ui-error',
    'data-disabled:pointer-events-none data-disabled:opacity-ui-disabled data-disabled:inset-ring-transparent',
  ],
  {
    variants: {
      tall: { true: 'min-h-16', false: '' },
    },
  }
)

export type FieldSurfaceProps = ComponentPropsWithRef<'div'> & {
  start?: ReactNode
  end?: ReactNode
  invalid?: boolean
  disabled?: boolean
  readOnly?: boolean
  tall?: boolean
}

/** Shared appearance only; each child control owns its name and value. */
export function FieldSurface({
  start,
  end,
  invalid,
  disabled,
  readOnly,
  tall,
  className,
  children,
  ...props
}: FieldSurfaceProps) {
  return (
    <div
      {...props}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(surfaceVariants({ tall }), className)}
    >
      {start != null && (
        <div
          inert={disabled || undefined}
          data-field-focus="preserve"
          className="flex shrink-0 self-stretch"
        >
          {start}
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center px-4',
          start != null && 'pl-0',
          end != null && 'pr-0'
        )}
      >
        {children}
      </div>
      {end != null && (
        <div
          inert={disabled || undefined}
          data-field-focus="preserve"
          className="flex shrink-0 self-stretch"
        >
          {end}
        </div>
      )}
      {(readOnly || disabled) && (
        <span
          aria-hidden
          className="field-hatched pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
      {invalid && <InvalidMark />}
    </div>
  )
}

function InvalidMark() {
  const id = useId()
  return (
    <svg
      aria-hidden
      // An SVG is a replaced element: `top` and `bottom` together would leave
      // it at its intrinsic 150px rather than stretching, so the height is
      // spelled out.
      className="pointer-events-none absolute top-3 left-0 h-[calc(100%-1.5rem)] w-[6px] translate-x-1 text-ui-error"
      preserveAspectRatio="none"
    >
      <defs>
        {/* One tile of the zigzag: 3px out and 3px down, then back. */}
        <pattern
          id={id}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <path
            d="M4.5 -3 L1.5 0 L4.5 3 L1.5 6 L4.5 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="var(--stroke-ui-control)"
          />
        </pattern>
      </defs>
      <rect width="6" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Passive addons focus the control; action addons preserve their own interaction. */
export function FieldAddon({
  kind = 'text',
  className,
  ...props
}: ComponentPropsWithRef<'div'> & { kind?: 'text' | 'icon' | 'action' }) {
  return (
    <div
      {...props}
      data-field-focus={kind === 'action' ? 'preserve' : 'control'}
      className={cn(
        'flex shrink-0 items-center justify-center text-ui-secondary',
        kind === 'text' && 'px-4',
        kind === 'icon' && 'w-12',
        kind === 'action' && 'p-1',
        className
      )}
    />
  )
}

export const fieldControlClass = cn(
  // The surface owns decoration; controls keep native editing behavior.
  'm-0 block w-full min-w-0 border-0 bg-transparent p-0 font-[family-name:inherit] text-ui-16 text-ui-primary outline-none',
  'placeholder:text-ui-placeholder disabled:cursor-default'
)

export type FieldPresentation = {
  label: string
  labelMode?: 'hidden' | 'floating'
  start?: ReactNode
  end?: ReactNode
  error?: ReactNode
  description?: ReactNode
  invalid?: boolean
  className?: string
  style?: CSSProperties
  controlClassName?: string
  controlStyle?: CSSProperties
}

type FieldProps = FieldPresentation & {
  disabled?: boolean
  readOnly?: boolean
  fixedLabel?: boolean
  controlRef: RefObject<HTMLElement | null>
  children: ReactNode
}

/** Base UI owns field state and accessibility; the surface owns appearance. */
export function Field({
  label,
  labelMode = 'hidden',
  start,
  end,
  error,
  description,
  invalid,
  className,
  style,
  disabled,
  readOnly,
  fixedLabel,
  controlRef,
  children,
}: FieldProps) {
  const visible = labelMode === 'floating'

  return (
    <FieldPrimitive.Root
      invalid={invalid ?? (error ? true : undefined)}
      disabled={disabled}
      className={className}
      style={style}
      render={(rootProps, state) => (
        <div {...rootProps}>
          <FieldSurface
            start={start}
            end={end}
            invalid={state.valid === false}
            disabled={state.disabled}
            readOnly={readOnly}
            tall={visible}
            onMouseDown={event => {
              if (state.disabled || event.defaultPrevented) return
              const target = event.target as HTMLElement
              if (
                target
                  .closest('[data-field-focus]')
                  ?.getAttribute('data-field-focus') === 'preserve'
              )
                return
              if (controlRef.current) {
                event.preventDefault()
                controlRef.current.focus()
              }
            }}
          >
            <div
              data-field-focus="preserve"
              className={cn(
                'relative min-w-0 flex-1 py-3',
                visible && 'pt-7 pb-2'
              )}
            >
              {children}
              <FieldPrimitive.Label
                className={cn(
                  !visible
                    ? 'sr-only'
                    : [
                        'absolute left-0 max-w-full truncate',
                        fixedLabel || state.filled || state.focused
                          ? 'top-2 text-ui-14 text-ui-secondary'
                          : 'top-1/2 -translate-y-1/2 text-ui-16 text-ui-placeholder',
                      ]
                )}
              >
                {label}
              </FieldPrimitive.Label>
            </div>
          </FieldSurface>
          {description && (
            <FieldPrimitive.Description className="m-0 px-4 pt-1 text-ui-14 text-ui-secondary">
              {description}
            </FieldPrimitive.Description>
          )}
          {error && (
            <FieldPrimitive.Error
              match
              className="m-0 px-4 pt-1 text-ui-14 text-ui-error"
            >
              {error}
            </FieldPrimitive.Error>
          )}
        </div>
      )}
    />
  )
}
