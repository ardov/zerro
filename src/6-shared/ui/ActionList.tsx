import { Toolbar } from '@base-ui/react/toolbar'
import { useRovingListKeys } from '6-shared/hooks/useRovingListKeys'
import { listRowClass } from './ListRow'
import { cn } from './shadcn/utils'

const ITEM_SELECTOR = '[data-slot="action-list-item"]'

/** A persistent list of actions inside an existing dialog.
 *
 * Toolbar semantics, not menu semantics: this list is always on screen and
 * was not opened by anything, so `role="menu"` would promise a popup that can
 * be dismissed and is not there. Base UI's Toolbar supplies roving focus, the
 * arrows and disabled-item handling; `useRovingListKeys` adds the Home/End
 * and typeahead behavior used by the action menus. */
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
      className={cn(listRowClass, className)}
      {...props}
    />
  )
}
