import { useImperativeHandle, useRef, type Ref } from 'react'
import { Toolbar } from '@base-ui/react/toolbar'
import { useRovingListKeys } from '@/6-shared/hooks/useRovingListKeys'
import { isPlainKey } from '@/6-shared/helpers/keyboard'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { ListRow, type ListRowProps } from './ListRow'

const itemSelector =
  '[data-action-item]:not(:disabled):not([aria-disabled="true"])'

export type ActionListHandle = { focus: () => void }
type ActionListProps = Omit<Toolbar.Root.Props, 'ref' | 'className'> & {
  ref?: Ref<ActionListHandle>
  className?: string
  /** ArrowUp from the first item can return to an associated field. */
  onNavigateBefore?: () => void
}

export function ActionList(props: ActionListProps) {
  const { ref, className, onKeyDown, onNavigateBefore, ...restProps } = props
  const root = useRef<HTMLDivElement>(null)
  const first = () => root.current?.querySelector<HTMLElement>(itemSelector)
  useImperativeHandle(ref, () => ({ focus: () => first()?.focus() }))
  const handleKeys = useRovingListKeys(itemSelector)
  return (
    <Toolbar.Root
      {...restProps}
      ref={root}
      orientation="vertical"
      loopFocus={false}
      className={cn('flex flex-col', className)}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (
          isPlainKey(event) &&
          event.key === 'ArrowUp' &&
          event.target === first() &&
          onNavigateBefore
        ) {
          event.preventDefault()
          onNavigateBefore()
        }
        handleKeys(event)
      }}
    />
  )
}

type ActionListItemProps = Omit<
  Toolbar.Button.Props,
  'render' | 'className' | 'focusableWhenDisabled'
> &
  Pick<ListRowProps, 'start' | 'end' | 'description' | 'selected' | 'className'>

export function ActionListItem(props: ActionListItemProps) {
  const { start, end, description, selected, className, ...restProps } = props
  return (
    <Toolbar.Button
      {...restProps}
      data-action-item
      focusableWhenDisabled={false}
      render={
        <ListRow
          render={<button type="button" />}
          start={start}
          end={end}
          description={description}
          selected={selected}
          className={cn(
            'hover:after:opacity-100 focus-visible:after:opacity-100',
            className
          )}
        />
      }
    />
  )
}
