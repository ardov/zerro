import {
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  type MouseEventHandler,
} from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from '@/6-shared/ui/Icons'
import { getLuminance } from '@/6-shared/ui/theme/color'
import { cn } from '@/6-shared/ui/shadcn/utils'

const chipVariants = cva(
  [
    'relative isolate inline-flex h-8 max-w-full shrink-0 items-center rounded-2xl rounded-smooth text-ui-16 font-normal text-ui-primary align-middle',
    '[--chip-hover:var(--color-ui-highlight)] [--chip-pressed:var(--color-ui-pressed)]',
    'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]',
  ],
  {
    variants: {
      variant: {
        filled: 'bg-ui-selected',
        outline: 'bg-transparent before:border before:border-ui-border',
        'outline-draft':
          'bg-transparent before:border before:border-dashed before:border-ui-border',
      },
      interactive: {
        true: 'hover:before:bg-(--chip-hover) active:before:bg-(--chip-pressed) focusable',
      },
      disabled: { true: 'opacity-ui-disabled' },
    },
    defaultVariants: { variant: 'filled' },
  }
)

/** className/style decorate the surface; native props and ref target the primary
 * button (or the label span when static). */
export type ChipProps = Omit<
  ComponentPropsWithRef<'span'>,
  'color' | 'onClick'
> & {
  /** Opaque HEX, RGB or OKLCH fill. Only used by the filled variant. */
  color?: string
  variant?: NonNullable<VariantProps<typeof chipVariants>['variant']>
  /** Decorative leading icon. */
  start?: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  onRemove?: () => void
  disabled?: boolean
}

export function Chip(props: ChipProps) {
  const {
    children,
    color,
    variant = 'filled',
    start,
    onClick,
    onRemove,
    disabled = false,
    className,
    style,
    onKeyDown,
    ref,
    ...restProps
  } = props
  const { t } = useTranslation()
  const labelId = useId()
  const removeId = useId()
  const primaryAction = onClick ?? onRemove
  const hasSeparateRemove = Boolean(onClick && onRemove)
  const interactive = Boolean(primaryAction)
  const Label = interactive ? 'button' : 'span'
  const foreground =
    color && variant === 'filled'
      ? getLuminance(color) > 0.179
        ? '#000'
        : '#fff'
      : undefined
  const palette = foreground
    ? ({
        backgroundColor: color,
        color: foreground,
        '--chip-hover': `color-mix(in srgb, ${foreground} 8%, transparent)`,
        '--chip-pressed': `color-mix(in srgb, ${foreground} 12%, transparent)`,
      } as CSSProperties)
    : undefined

  return (
    <span
      data-slot="chip"
      data-disabled={disabled || undefined}
      style={{ ...palette, ...style }}
      onKeyDown={event => {
        if (event.defaultPrevented || disabled || !onRemove) return
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          event.stopPropagation()
          if (!event.repeat) onRemove()
        }
      }}
      className={cn(
        chipVariants({
          variant,
          interactive: interactive && !disabled,
          disabled,
        }),
        className
      )}
    >
      {onRemove && (
        <span id={removeId} className="sr-only">
          {t('removeValue', { label: '' })}
        </span>
      )}
      <Label
        {...restProps}
        ref={node => {
          if (typeof ref === 'function') return ref(node)
          if (ref) ref.current = node
        }}
        onKeyDown={onKeyDown}
        type={interactive ? 'button' : undefined}
        disabled={interactive ? disabled : undefined}
        onClick={
          interactive
            ? event => {
                event.stopPropagation()
                if (!disabled) primaryAction?.(event)
              }
            : undefined
        }
        aria-labelledby={
          restProps['aria-labelledby'] ??
          (restProps['aria-label']
            ? undefined
            : onRemove && !hasSeparateRemove
              ? `${removeId} ${labelId}`
              : labelId)
        }
        className={cn(
          'inline-flex h-full min-w-0 items-center rounded-[inherit] outline-none',
          start != null ? 'pl-1' : 'pl-4',
          onRemove ? 'pr-1' : 'pr-4',
          interactive && 'cursor-pointer disabled:cursor-default'
        )}
      >
        {start != null && (
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center [&_svg]:size-5"
          >
            {start}
          </span>
        )}
        <span id={labelId} className="truncate">
          {children}
        </span>
        {onRemove && !hasSeparateRemove && (
          <span
            aria-hidden
            className={cn(
              'ml-1 flex size-6 shrink-0 items-center justify-center rounded-full',
              !disabled && 'hover:bg-(--chip-hover) active:bg-(--chip-pressed)'
            )}
          >
            <CloseIcon className="size-4" />
          </span>
        )}
      </Label>
      {hasSeparateRemove && (
        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          aria-labelledby={`${removeId} ${labelId}`}
          onClick={event => {
            event.stopPropagation()
            onRemove?.()
          }}
          className="mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none disabled:cursor-default enabled:hover:bg-(--chip-hover) enabled:active:bg-(--chip-pressed)"
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </span>
  )
}
