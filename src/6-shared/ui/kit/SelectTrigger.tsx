import { useId, useRef, type MouseEvent, type Ref, type ReactNode } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { FieldAddon, FieldSurface, FieldContent, FieldMessage } from './Field'
import { IconButton } from './Button'

export type SelectTriggerProps = useRender.ComponentProps<'button'> & {
  label: string
  /** Position a popup against the whole field, including its addons. */
  surfaceRef?: Ref<HTMLDivElement>
  size?: 'lg' | 'sm'
  labelMode?: 'hidden' | 'floating'
  start?: ReactNode
  placeholder?: string
  filled?: boolean
  required?: boolean
  readOnly?: boolean
  invalid?: boolean
  description?: ReactNode
  error?: ReactNode
  /** Supply only for an optional, clearable value. */
  onClear?: () => void
  /** Localized accessible name for the clear button. */
  clearLabel?: string
}

/** Field appearance; the composed primitive owns popup state and selection. */
export function SelectTrigger(props: SelectTriggerProps) {
  const {
    label,
    surfaceRef,
    size = 'lg',
    labelMode = 'hidden',
    start,
    placeholder,
    filled = false,
    required,
    readOnly,
    disabled,
    invalid,
    description,
    error,
    onClear,
    clearLabel = 'Clear selection',
    children,
    className,
    style,
    render,
    ref,
    id,
    ...restProps
  } = props
  const generatedId = useId()
  const controlId = id ?? generatedId
  const labelId = `${controlId}-label`
  const descriptionId = `${controlId}-description`
  const errorId = `${controlId}-error`
  const controlRef = useRef<HTMLButtonElement>(null)
  const effectiveInvalid =
    invalid ??
    (Boolean(error) ||
      restProps['aria-invalid'] === true ||
      restProps['aria-invalid'] === 'true')
  const floating = labelMode === 'floating'
  const unavailable = disabled || readOnly
  const clearable = filled && !required && !unavailable && onClear
  const describedBy =
    [
      restProps['aria-describedby'],
      description && descriptionId,
      error && errorId,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  const trigger = useRender({
    defaultTagName: 'button',
    render: unavailable ? undefined : render,
    ref: [ref ?? null, controlRef],
    props: {
      ...restProps,
      id: controlId,
      type: 'button',
      disabled,
      'aria-labelledby':
        restProps['aria-labelledby'] ??
        (restProps['aria-label']
          ? undefined
          : `${labelId}${filled ? ` ${controlId}-value` : ''}`),
      'aria-describedby': describedBy,
      'aria-invalid': effectiveInvalid || undefined,
      'aria-disabled': readOnly || undefined,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        if (unavailable) {
          event.preventDefault()
          return
        }
        restProps.onClick?.(event)
      },
      className: cn(
        'group/trigger flex w-full min-w-0 cursor-default items-center gap-3 text-left outline-none select-none',
        // The whole field opens the panel, so the button reaches over the
        // surface. Anything meant to stay pressable sits above this layer.
        'before:absolute before:inset-0 before:rounded-[inherit]'
      ),
      children: (
        <span
          id={`${controlId}-value`}
          className={cn(
            'min-w-0 flex-1 wrap-anywhere',
            !filled && 'text-ui-placeholder'
          )}
        >
          {filled ? children : (placeholder ?? (floating ? '\u00a0' : label))}
        </span>
      ),
    },
  })
  return (
    <div className={className} style={style}>
      <FieldSurface
        ref={surfaceRef}
        className="group/select-field"
        size={size}
        tall={floating}
        start={
          start != null ? (
            <FieldAddon kind="icon">
              <span
                aria-hidden
                className="flex size-5 items-center justify-center [&>svg]:size-5 [&>img]:size-full [&>img]:object-contain"
              >
                {start}
              </span>
            </FieldAddon>
          ) : undefined
        }
        disabled={disabled}
        readOnly={readOnly}
        invalid={effectiveInvalid}
        end={
          clearable ? (
            // Above the trigger's full-surface hit area, so the press lands here.
            <FieldAddon kind="action" className="relative z-10">
              <IconButton
                label={clearLabel}
                tooltip={false}
                variant="ghost"
                size="sm"
                className={size === 'sm' ? 'size-8' : undefined}
                onClick={() => {
                  onClear()
                  controlRef.current?.focus()
                }}
              >
                <X />
              </IconButton>
            </FieldAddon>
          ) : !unavailable ? (
            <FieldAddon kind="icon" className="pointer-events-none">
              <ChevronDown aria-hidden className="size-5" />
            </FieldAddon>
          ) : undefined
        }
      >
        <FieldContent
          size={size}
          floating={floating}
          raised={filled || Boolean(placeholder)}
          label={label}
          labelRender={<label id={labelId} htmlFor={controlId} />}
        >
          {trigger}
        </FieldContent>
      </FieldSurface>
      {description && (
        <FieldMessage id={descriptionId}>{description}</FieldMessage>
      )}
      {error && (
        <FieldMessage id={errorId} error>
          {error}
        </FieldMessage>
      )}
    </div>
  )
}
