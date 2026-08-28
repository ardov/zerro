import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from './shadcn/utils'

/** The row vocabulary MUI spread across `MenuItem`, `ListItemIcon`,
 * `ListItemText`, `ListItemSecondaryAction`, `ListSubheader` and `Divider`.
 *
 * Two containers use it and their semantics differ: `ActionList` is a toolbar
 * that is always on screen, `Menu` is a menu that something opened. The
 * geometry is the same in both, so it lives here rather than being written
 * twice or borrowed from whichever component happened to define it first.
 * These are not published as generic `ListItemIcon` / `Divider`, because they
 * carry the geometry of these two lists and nothing else needs them.
 *
 * The disabled state is spelled twice on purpose. A toolbar row is a real
 * `button` and carries `disabled`; a menu row is a `div` with `aria-disabled`,
 * because a menu keeps its disabled items focusable so they are still
 * announced. Only one of the two variants matches in either container. */
export const listRowClass =
  'relative flex min-h-12 w-full min-w-0 cursor-pointer items-center rounded-lg border-0 bg-transparent px-4 py-1.5 text-left font-sans type-body whitespace-nowrap text-foreground hover:bg-accent focus-visible:bg-action-focus focus-visible:outline-none data-selected:bg-primary-selected data-selected:hover:bg-primary-selected-hover disabled:pointer-events-none disabled:opacity-disabled aria-disabled:pointer-events-none aria-disabled:opacity-disabled sm:min-h-9'

export function ListRowIcon({
  className,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex min-w-9 shrink-0 items-center text-action-active',
        className
      )}
      {...props}
    />
  )
}

/** No margin of its own: MUI's `ListItemText` has one, but `MenuItem` zeroes
 * it, and a row that keeps it is 8px taller than the one it replaced. */
export function ListRowText({
  className,
  secondary,
  children,
  ...props
}: ComponentPropsWithoutRef<'span'> & { secondary?: ReactNode }) {
  return (
    <span
      className={cn('m-0 min-w-0 flex-auto type-body', className)}
      {...props}
    >
      {children}
      {secondary && (
        <span className="block type-body-sm text-muted-foreground">
          {secondary}
        </span>
      )}
    </span>
  )
}

/** MUI positions a secondary action absolutely; in a flex row the same place
 * is reached by pushing it to the end, without taking it out of the flow. */
export function ListRowAction({
  className,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn('ml-4 inline-flex shrink-0 items-center', className)}
      {...props}
    />
  )
}

export function ListRowSubheader({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="list-row-subheader"
      className={cn(
        'box-border block min-w-0 bg-card px-4 text-sm/[48px] font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function ListRowDivider({
  className,
  ...props
}: ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      className={cn(
        'm-0 min-w-0 shrink-0 border-x-0 border-t-0 border-b border-solid border-border',
        className
      )}
      {...props}
    />
  )
}
