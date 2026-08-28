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
        'relative flex min-h-12 w-full cursor-pointer items-center rounded-lg border-0 bg-transparent px-4 py-1.5 text-left font-sans type-body whitespace-nowrap hover:bg-accent focus-visible:bg-action-focus focus-visible:outline-none data-selected:bg-primary-selected data-selected:hover:bg-primary-selected-hover disabled:pointer-events-none disabled:opacity-disabled sm:min-h-9',
        className
      )}
      {...props}
    />
  )
}
