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
import { getContrastText } from '@/6-shared/helpers/color'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { TextFade } from './TextFade'
import '../coloredSurface.css'
import './Chip.css'

const chipVariants = cva(
  [
    'relative isolate inline-flex max-w-full shrink-0 items-center rounded-2xl rounded-smooth font-normal text-ui-primary align-middle',
    '[--chip-hover:var(--color-ui-highlight)] [--chip-pressed:var(--color-ui-pressed)]',
    'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]',
  ],
  {
    variants: {
      size: {
        sm: 'h-6 text-ui-14',
        md: 'h-8 text-ui-16',
      },
      variant: {
        filled: 'bg-ui-selected',
        outline: 'bg-transparent before:border before:border-ui-border',
        'outline-draft':
          'bg-transparent text-ui-secondary [--chip-hover:transparent] [--chip-pressed:transparent] before:border before:border-dashed before:border-ui-border',
      },
      interactive: {
        true: 'hover:before:bg-(--chip-hover) active:before:bg-(--chip-pressed) focusable',
      },
      disabled: { true: 'opacity-ui-disabled' },
    },
    compoundVariants: [
      {
        variant: 'outline-draft',
        interactive: true,
        className:
          'hover:text-ui-primary active:text-ui-primary hover:before:border-ui-primary/20 active:before:border-ui-primary/20',
      },
    ],
    defaultVariants: { variant: 'filled', size: 'md' },
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
  size?: 'sm' | 'md'
  checked?: boolean
  start?: ReactNode
  /** On desktop, replace the leading icon with the removal action on hover. */
  removeOnHover?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  onRemove?: () => void
  disabled?: boolean
}

export function Chip(props: ChipProps) {
  const {
    children,
    color,
    variant = 'filled',
    size = 'md',
    checked,
    start,
    removeOnHover,
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
  const appearance =
    checked === undefined ? variant : checked ? 'filled' : 'outline'
  const compact = size === 'sm'
  const foreground =
    color && appearance === 'filled' ? getContrastText(color) : undefined
  const palette = foreground
    ? ({
        backgroundColor: color,
        '--surface-color': color,
        '--surface-direction': foreground === '#ffffff' ? -1 : 1,
        color: foreground,
        '--chip-hover': `color-mix(in srgb, ${foreground} 8%, transparent)`,
        '--chip-pressed': `color-mix(in srgb, ${foreground} 12%, transparent)`,
      } as CSSProperties)
    : undefined

  return (
    <span
      data-slot="chip"
      data-remove-on-hover={
        (removeOnHover && hasSeparateRemove && start != null) || undefined
      }
      data-surface-interactive={
        interactive && !disabled && foreground ? true : undefined
      }
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
          variant: appearance,
          size,
          interactive: interactive && !disabled && !foreground,
          disabled,
        }),
        foreground && 'colored-surface',
        foreground && interactive && !disabled && 'focusable',
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
        aria-pressed={
          onClick && checked !== undefined ? checked : restProps['aria-pressed']
        }
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
          start != null ? 'pl-1' : compact ? 'pl-2' : 'pl-4',
          onRemove
            ? 'pr-[var(--chip-remove-gap,0.25rem)]'
            : compact
              ? 'pr-2'
              : 'pr-4',
          interactive && 'cursor-pointer disabled:cursor-default'
        )}
      >
        {start != null && (
          <span
            aria-hidden
            data-chip-icon=""
            className={cn(
              'flex shrink-0 items-center justify-center',
              compact ? 'size-5 [&_svg]:size-4' : 'size-8 [&_svg]:size-5'
            )}
          >
            {start}
          </span>
        )}
        <TextFade id={labelId}>{children}</TextFade>
        {onRemove && !hasSeparateRemove && (
          <span
            aria-hidden
            className={cn(
              'ml-1 flex shrink-0 items-center justify-center rounded-full',
              compact ? 'size-4' : 'size-6',
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
          data-chip-remove=""
          disabled={disabled}
          tabIndex={-1}
          aria-labelledby={`${removeId} ${labelId}`}
          onClick={event => {
            event.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            'mr-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none disabled:cursor-default enabled:hover:bg-(--chip-hover) enabled:active:bg-(--chip-pressed)',
            compact ? 'size-4' : 'size-6'
          )}
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </span>
  )
}
