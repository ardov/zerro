import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { PressBacking } from './PressBacking'
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
  'relative flex w-full min-w-0 cursor-pointer items-center border-0 bg-transparent text-left font-sans whitespace-nowrap text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-disabled aria-disabled:pointer-events-none aria-disabled:opacity-disabled'

/** The rows the application's own lists are built from, which paint their own
 * background. */
const paintedRow = `${rowBase} rounded-lg px-4 hover:bg-accent focus-visible:bg-focus-surface data-selected:bg-primary-selected data-selected:hover:bg-primary-selected-hover`

/** A row in a menu, a select list or an action bar.
 *
 * As tall as a field and following the same horizontal rhythm: 16px for a
 * plain label, or one 48px leading slot whose glyph is centred at 24px. The
 * 12px radius is concentric inside the surface's 16px once the surface's own
 * 4px is taken off.
 *
 * It paints nothing itself: the fill, the highlight and the press all belong
 * to the `PressBacking` layers the row renders, which is what keeps the press
 * on the background instead of dragging the label into it. `isolate` is what
 * lets those layers sit behind the content. */
export const listRowClass = `${rowBase} group isolate min-h-12 rounded-xl px-4 py-1.5 text-body [&>[data-slot=list-row-icon]]:-my-1.5 [&>[data-slot=list-row-icon]]:h-12 [&>[data-slot=list-row-icon]]:self-start`

/** Everything a `listRowClass` row is painted with. Rendered as the row's
 * first child.
 *
 * Two layers rather than three colours: the chosen row keeps its fill and the
 * highlight goes over it, so a selected row under the pointer is one
 * translucent layer over another and nobody has to mix the result by hand.
 * A row that is merely resting has no fill at all. */
export function ListRowBacking({ selected }: { selected?: boolean }) {
  return (
    <>
      {/* The resting fill. `selected` is for a row that tracks its own choice;
          a list whose primitive already marks the chosen row — Base UI writes
          `data-selected` on it — needs to pass nothing. */}
      <PressBacking
        className={cn(
          'group-data-selected:bg-selected',
          selected && 'bg-selected'
        )}
      />
      <PressBacking className="group-hover:bg-foreground-hover group-focus-visible:bg-foreground-hover group-data-highlighted:bg-foreground-hover" />
    </>
  )
}

export const listItemClass = `${paintedRow} py-2 text-body`

/** A dense list row, which halves the padding and drops the label to
 * `body2`. The account, debtor and history lists are all dense. */
export const listItemDenseClass = `${paintedRow} py-1 text-body-sm`

export function ListRowIcon({
  className,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="list-row-icon"
      className={cn(
        'inline-flex w-12 shrink-0 -ml-4 items-center justify-center text-icon-foreground',
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
        <span className="block min-w-0 overflow-hidden text-ellipsis text-body-sm text-muted-foreground">
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
