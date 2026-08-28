import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Toolbar } from '@base-ui/react/toolbar'
import { useRovingListKeys } from '6-shared/hooks/useRovingListKeys'
import { cn } from './shadcn/utils'

const ITEM_SELECTOR = '[data-slot="action-list-item"]'

/** A persistent list of actions inside an existing dialog.
 *
 * Toolbar semantics, not menu semantics: this list is always on screen and
 * was not opened by anything, so `role="menu"` would promise a popup that can
 * be dismissed and is not there. Base UI's Toolbar supplies roving focus, the
 * arrows and disabled-item handling; `useRovingListKeys` adds the Home/End
 * and typeahead the replaced MUI `MenuList` had. */
export function ActionList({
  className,
  onKeyDown,
  ...props
}: Omit<Toolbar.Root.Props, 'className'> & { className?: string }) {
  const handleRovingKeys = useRovingListKeys(ITEM_SELECTOR)
  return (
    <Toolbar.Root
      orientation="vertical"
      loopFocus
      data-slot="action-list"
      className={cn('m-0 flex flex-col py-2 outline-none', className)}
      {...props}
      onKeyDown={event => {
        onKeyDown?.(event)
        handleRovingKeys(event)
      }}
    />
  )
}

export function ActionListItem({
  className,
  selected,
  ...props
}: Omit<Toolbar.Button.Props, 'className'> & {
  className?: string
  selected?: boolean
}) {
  return (
    <Toolbar.Button
      data-slot="action-list-item"
      data-selected={selected || undefined}
      className={cn(
        'relative flex min-h-12 w-full min-w-0 cursor-pointer items-center rounded-lg border-0 bg-transparent px-4 py-1.5 text-left font-sans type-body whitespace-nowrap text-foreground hover:bg-accent focus-visible:bg-action-focus focus-visible:outline-none data-selected:bg-primary-selected data-selected:hover:bg-primary-selected-hover disabled:pointer-events-none disabled:opacity-disabled sm:min-h-9',
        className
      )}
      {...props}
    />
  )
}

/** The parts a MUI `MenuItem` was assembled from, kept inside the ActionList
 * family rather than published as generic `ListItemIcon` / `Divider`: they
 * carry the geometry of this list and nothing else needs them. */
export function ActionListItemIcon({
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

export function ActionListItemText({
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
export function ActionListItemAction({
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

export function ActionListSubheader({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="action-list-subheader"
      className={cn(
        'box-border block min-w-0 bg-card px-4 text-sm/[48px] font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function ActionListDivider({
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
