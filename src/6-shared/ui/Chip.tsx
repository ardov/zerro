import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from './Icons'
import { cn } from './shadcn/utils'

export type ChipProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'color'
> & {
  label?: ReactNode
  size?: 'medium' | 'small'
  variant?: 'filled' | 'outlined'
  color?: 'default' | 'primary'
  /** Renders the trailing cross; one call site replaces the default icon. */
  onDelete?: () => void
  deleteIcon?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/** A pill that labels something, sometimes with a cross that
 * takes it away.
 *
 * A `div` rather than a button keeps a chip with a delete action from nesting
 * one button inside another. Both roles are explicit for assistive technology. */
export function Chip({
  label,
  size = 'medium',
  variant = 'filled',
  color = 'default',
  onDelete,
  deleteIcon,
  onClick,
  onKeyDown,
  onKeyUp,
  tabIndex,
  className,
  ...props
}: ChipProps) {
  const { t } = useTranslation()
  const labelId = useId()
  const removeId = useId()
  const small = size === 'small'
  const interactive = Boolean(onClick || onDelete)
  const deleteClass = cn(
    'inline-flex shrink-0 cursor-pointer items-center text-chip-delete hover:text-chip-delete-hover group-has-[:focus-visible]:text-inherit',
    small
      ? '-ml-1 mr-1 [&>svg]:size-4'
      : '-ml-1.5 mr-[5px] [&>svg]:size-[22px]',
    variant === 'outlined' && small && 'mr-[3px]'
  )
  const Label = interactive ? 'button' : 'span'
  return (
    <div
      data-slot="chip"
      onClick={
        onClick ??
        (onDelete
          ? event => {
              event.stopPropagation()
              onDelete()
            }
          : undefined)
      }
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (onDelete && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault()
          return
        }
      }}
      onKeyUp={event => {
        onKeyUp?.(event)
        if (event.defaultPrevented) return
        if (onDelete && (event.key === 'Backspace' || event.key === 'Delete')) {
          onDelete()
          return
        }
      }}
      className={cn(
        // Half the height — a pill, but a
        // measurable one rather than the 9999px that `rounded-full` computes
        // to.
        'group box-border inline-flex max-w-full cursor-[unset] items-center justify-center border-none p-0 align-middle font-sans whitespace-nowrap text-foreground outline-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:bg-primary has-[:focus-visible]:text-primary-foreground',
        // The radius and root type stay fixed; the label owns the smaller type.
        'rounded-2xl text-[0.8125rem]',
        small ? 'h-6' : 'h-8',
        // The selected surface is the chip's own resting fill.
        variant === 'filled'
          ? 'bg-selected'
          : 'border border-solid bg-transparent',
        // `border-none` above is the filled chip's; an outlined one restores
        // the style along with the width.
        variant === 'outlined' &&
          (color === 'primary'
            ? 'border-chip-primary-border'
            : 'border-chip-border'),
        color === 'primary' &&
          (variant === 'filled'
            ? 'bg-primary text-primary-foreground'
            : 'text-primary'),
        onClick && 'cursor-pointer',
        onClick &&
          (color === 'primary' && variant === 'outlined'
            ? 'hover:bg-primary-hover'
            : 'hover:bg-chip-hover'),
        className
      )}
      {...props}
    >
      {onDelete && (
        <span id={removeId} className="sr-only">
          {t('removeValue', { label: '' })}
        </span>
      )}
      <Label
        type={interactive ? 'button' : undefined}
        tabIndex={interactive ? (tabIndex ?? 0) : undefined}
        aria-labelledby={
          !onClick && onDelete ? `${removeId} ${labelId}` : undefined
        }
        data-slot="chip-label"
        className={cn(
          'inline-flex min-w-0 items-center',
          interactive &&
            'h-full cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit outline-none'
        )}
      >
        <span
          id={labelId}
          className={cn(
            'overflow-hidden text-ellipsis whitespace-nowrap',
            small ? 'px-2' : 'px-3',
            variant === 'outlined' && (small ? 'px-[7px]' : 'px-[11px]')
          )}
        >
          {label}
        </span>
        {onDelete && !onClick && (
          <span aria-hidden className={deleteClass}>
            {deleteIcon ?? <CloseIcon />}
          </span>
        )}
      </Label>
      {onDelete && onClick && (
        <button
          type="button"
          tabIndex={-1}
          data-slot="chip-delete"
          aria-labelledby={`${removeId} ${labelId}`}
          onClick={event => {
            event.stopPropagation()
            onDelete()
          }}
          className={cn(
            deleteClass,
            'border-0 bg-transparent p-0 outline-none'
          )}
        >
          {deleteIcon ?? <CloseIcon />}
        </button>
      )}
    </div>
  )
}
