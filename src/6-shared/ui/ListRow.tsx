import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'

const rowBase =
  'relative flex w-full min-w-0 cursor-pointer items-center border-0 bg-transparent text-left font-sans whitespace-nowrap text-ui-primary focusable disabled:pointer-events-none disabled:opacity-ui-disabled aria-disabled:pointer-events-none aria-disabled:opacity-ui-disabled'

const paintedRow = `${rowBase} isolate rounded-lg px-4 data-selected:bg-ui-selected after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] hover:after:bg-ui-highlight active:after:bg-ui-pressed`

export const listItemDenseClass = `${paintedRow} py-1 text-body-sm`

export function ListRowSubheader({
  className,
  sticky,
  ...props
}: ComponentPropsWithoutRef<'div'> & { sticky?: boolean }) {
  return (
    <div
      data-slot="list-row-subheader"
      className={cn(
        'box-border block min-w-0 bg-ui-card px-4 text-sm/[48px] font-medium text-ui-secondary',
        sticky && 'sticky top-0 z-[1]',
        className
      )}
      {...props}
    />
  )
}

/** Callers supply list semantics; this container stays a div. */
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
