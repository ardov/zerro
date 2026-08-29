import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'
import { CloseIcon } from './feather'
import { cn } from './shadcn/utils'

export type ChipProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'color'
> & {
  label?: ReactNode
  size?: 'medium' | 'small'
  variant?: 'filled' | 'outlined'
  color?: 'default' | 'primary'
  /** Renders the trailing cross. MUI took the icon too, and one call site
   * replaces it. */
  onDelete?: () => void
  deleteIcon?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/** MUI's `Chip`: a pill that labels something, sometimes with a cross that
 * takes it away.
 *
 * A `div` rather than a button even when it has an `onClick`, because that is
 * what MUI rendered: a chip with a delete cross would otherwise be a button
 * inside a button. Both roles are spelled out for assistive technology
 * instead. */
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
  const small = size === 'small'
  // A deletable chip is focusable so Backspace and Delete can reach it, but
  // only a chip that does something when it is activated is a button: Enter
  // and Space on a delete-only chip do nothing, and announcing it as a button
  // promises an action it does not have.
  const interactive = Boolean(onClick || onDelete)
  return (
    <div
      data-slot="chip"
      role={onClick ? 'button' : undefined}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      onClick={onClick}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (onDelete && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault()
          return
        }
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          if (event.key === 'Enter') event.currentTarget.click()
        }
      }}
      onKeyUp={event => {
        onKeyUp?.(event)
        if (event.defaultPrevented) return
        if (onDelete && (event.key === 'Backspace' || event.key === 'Delete')) {
          onDelete()
          return
        }
        if (onClick && event.key === ' ') event.currentTarget.click()
      }}
      className={cn(
        // Half the height, which MUI spells as `32 / 2` — a pill, but a
        // measurable one rather than the 9999px that `rounded-full` computes
        // to.
        'box-border inline-flex max-w-full cursor-[unset] items-center justify-center border-none p-0 align-middle font-sans whitespace-nowrap text-foreground outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        // The radius and the root's type do not change with the size: MUI
        // puts the smaller type on the label instead.
        'rounded-2xl text-[0.8125rem]',
        small ? 'h-6' : 'h-8',
        // `--secondary` is `action.selected`, which is the chip's own fill.
        variant === 'filled'
          ? 'bg-secondary'
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
      <span
        data-slot="chip-label"
        className={cn(
          'overflow-hidden text-ellipsis whitespace-nowrap',
          small ? 'px-2' : 'px-3',
          // An outlined chip is a pixel narrower on each side, so its label
          // gives that pixel back and the pill keeps the same width.
          variant === 'outlined' && (small ? 'px-[7px]' : 'px-[11px]')
        )}
      >
        {label}
      </span>
      {onDelete && (
        <span
          data-slot="chip-delete"
          aria-hidden
          onClick={event => {
            event.stopPropagation()
            onDelete()
          }}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center text-chip-delete hover:text-chip-delete-hover',
            // The cross hangs into the label's own padding, which is why the
            // right margin is negative. Being outlined does not change that —
            // MUI's outlined margins belong to the leading icon, which this
            // chip has no call site for.
            small
              ? '-mr-1 ml-1 [&>svg]:size-4'
              : '-mr-1.5 ml-[5px] [&>svg]:size-[22px]'
          )}
        >
          {deleteIcon ?? <CloseIcon />}
        </span>
      )}
    </div>
  )
}
