import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from './shadcn/utils'

/** Shared row vocabulary for menus, action lists and navigation.
 *
 * Two containers use it and their semantics differ: `ActionList` is a toolbar
 * that is always on screen, `Menu` is a menu that something opened. The
 * geometry is the same in both, so it lives here rather than being written
 * twice or borrowed from whichever component happened to define it first.
 * These are not published as a generic `ListItemIcon`, because they carry the
 * geometry of these two lists and nothing else needs them. The rule between
 * rows was the exception and now lives in `Divider.tsx`: it never carried any
 * geometry of theirs, and two surfaces outside these lists draw the same one.
 *
 * The disabled state is spelled twice on purpose. A toolbar row is a real
 * `button` and carries `disabled`; a menu row is a `div` with `aria-disabled`,
 * because a menu keeps its disabled items focusable so they are still
 * announced. Only one of the two variants matches in either container. */
const rowBase =
  'relative flex w-full min-w-0 cursor-pointer items-center rounded-lg border-0 bg-transparent px-4 text-left font-sans whitespace-nowrap text-foreground hover:bg-accent focus-visible:bg-focus-surface focus-visible:outline-none data-selected:bg-primary-selected data-selected:hover:bg-primary-selected-hover disabled:pointer-events-none disabled:opacity-disabled aria-disabled:pointer-events-none aria-disabled:opacity-disabled'

/** A menu row, tighter than a list row and with a
 * minimum height so a row with no icon still reads as a target. */
export const listRowClass = `${rowBase} min-h-12 py-1.5 type-body sm:min-h-9`

/** A list row. Taller than a menu row — 8px around a
 * label that keeps its own 4px, where `MenuItem` takes 6px and zeroes the
 * label's — and no minimum, because a list row is sized by what is in it.
 *
 * The two are separate classes rather than one with an override, because
 * every call site that reached for the menu row and then added `py-2` was
 * rederiving this one. */
export const listItemClass = `${rowBase} py-2 type-body`

/** A dense list row, which halves the padding and drops the label to
 * `body2`. The account, debtor and history lists are all dense. */
export const listItemDenseClass = `${rowBase} py-1 type-body-sm`

export function ListRowIcon({
  className,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex min-w-9 shrink-0 items-center text-icon-foreground',
        className
      )}
      {...props}
    />
  )
}

/** No margin of its own: menu rows stay compact, while list rows add `my-1`.
 *
 * No type of its own either — it inherits the row's, so the same label is
 * `body1` in a regular row and `body2` in a dense one. */
export function ListRowText({
  className,
  secondary,
  children,
  ...props
}: ComponentPropsWithoutRef<'span'> & { secondary?: ReactNode }) {
  return (
    <span
      data-slot="list-row-text"
      className={cn('m-0 min-w-0 flex-auto', className)}
      {...props}
    >
      {children}
      {secondary && (
        // No wrapping rule of its own: it inherits the row's, so a truncating
        // row truncates it too. It clips with an ellipsis under `whitespace-nowrap`
        // and wraps freely under a `whitespace-normal` row, where
        // nothing overflows for the ellipsis to land on.
        <span className="block min-w-0 overflow-hidden text-ellipsis type-body-sm text-muted-foreground">
          {secondary}
        </span>
      )}
    </span>
  )
}

/** Push a secondary action to the end without taking it out of the flow. */
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

/** A list subheader whose optional behaviors are explicit. `sticky` is a prop
 * scrolling lists request rather than a default menus must disable.
 *
 * There is no `dense` option because subheader geometry does not inherit row
 * density. */
export function ListRowSubheader({
  className,
  sticky,
  ...props
}: ComponentPropsWithoutRef<'div'> & { sticky?: boolean }) {
  return (
    <div
      data-slot="list-row-subheader"
      className={cn(
        'box-border block min-w-0 bg-card px-4 text-sm/[48px] font-medium text-muted-foreground',
        sticky && 'sticky top-0 z-[1]',
        className
      )}
      {...props}
    />
  )
}

/** The box around a stack of rows, with 8px above and below
 * that `disablePadding` takes away. `dense` is not a prop here — it only ever
 * set a context that told the rows below to be dense, and the rows say so
 * themselves.
 *
 * A `div`, not a `ul`, because several consumers are action groups rather than
 * semantic lists. Where the
 * list semantics are real — the navigation links, the tag options — the call
 * site builds a `ul` of `li`s itself and skips this. */
export function ListRows({
  className,
  disablePadding,
  ...props
}: ComponentPropsWithoutRef<'div'> & { disablePadding?: boolean }) {
  return (
    <div
      data-slot="list-rows"
      className={cn(
        'relative m-0 flex list-none flex-col p-0',
        !disablePadding && 'py-2',
        className
      )}
      {...props}
    />
  )
}
