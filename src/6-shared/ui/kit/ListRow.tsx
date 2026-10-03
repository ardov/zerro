import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { FieldAddon } from './Field'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type ListRowSize = 'lg' | 'sm'

export type ListRowProps = useRender.ComponentProps<'div'> & {
  size?: ListRowSize
  start?: ReactNode
  /** Trailing value inherits the first line's typography; style metadata explicitly. */
  end?: ReactNode
  description?: ReactNode
  /** Reserve this slot for every row when the source list contains images. */
  reserveStart?: boolean
  /** Visual indentation only; this is still a flat list, not a tree widget. */
  indent?: number
  selected?: boolean
  highlighted?: boolean
}

/** Presentation only. The rendered primitive owns semantics and interaction.
 * Highlight comes from the list owner or Base UI's data-highlighted attribute;
 * an independent :hover would leave two highlighted rows during keyboard use. */
export function ListRow(props: ListRowProps) {
  const {
    size = 'lg',
    start,
    end,
    description,
    reserveStart = false,
    indent = 0,
    style,
    selected,
    highlighted,
    className,
    children,
    render,
    ref,
    ...restProps
  } = props
  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    props: {
      ...restProps,
      style: {
        ...style,
        ...(indent > 0 && {
          paddingInlineStart: `calc(${indent} * var(--spacing) * 10)`,
        }),
      },
      ...(selected !== undefined && { 'data-selected': selected || undefined }),
      ...(highlighted !== undefined && {
        'data-highlighted': highlighted || undefined,
      }),
      className: cn(
        // Layout and shared typography
        'relative isolate flex w-full min-w-0 cursor-default items-center border-0 bg-transparent text-left font-[family-name:inherit] text-ui-16 text-ui-primary whitespace-normal select-none',
        'rounded-smooth before:rounded-smooth after:rounded-smooth outline-none',
        size === 'lg'
          ? 'min-h-12 rounded-ui-control px-4 py-3'
          : 'min-h-10 rounded-ui-control-inner px-3 py-2',
        (reserveStart || start != null) && 'pl-0',
        // Selection is the base; highlight is a separate translucent layer.
        'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-ui-selected before:opacity-0',
        'data-selected:before:opacity-100',
        'after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-ui-highlight after:opacity-0',
        'data-highlighted:after:opacity-100',
        // Only the backing moves. Disabled rows never respond to a press.
        'before:transition-transform before:duration-150 before:ease-[ease] after:transition-transform after:duration-150 after:ease-[ease]',
        '[&:active:not(:disabled):not([aria-disabled=true]):not([data-disabled])]:before:scale-98',
        '[&:active:not(:disabled):not([aria-disabled=true]):not([data-disabled])]:after:scale-98',
        '[&:active:not(:disabled):not([aria-disabled=true]):not([data-disabled])]:after:bg-ui-pressed',
        '[&:active:not(:disabled):not([aria-disabled=true]):not([data-disabled])]:after:opacity-100',
        'motion-reduce:before:transition-none motion-reduce:after:transition-none motion-reduce:before:scale-100! motion-reduce:after:scale-100!',
        'data-disabled:opacity-ui-disabled aria-disabled:opacity-ui-disabled disabled:opacity-ui-disabled',
        // Adjacent selected rows share smaller corners at their seam.
        '[&[data-selected]:has(+[data-selected])]:rounded-b-sm',
        '[&[data-selected]+[data-selected]]:rounded-t-sm',
        'transition-[border-radius] duration-150 ease-in-out motion-reduce:transition-none',
        className
      ),
      children: (
        <>
          {(reserveStart || start != null) && (
            <FieldAddon
              kind="icon"
              aria-hidden
              className={cn(
                'self-start text-ui-primary',
                size === 'lg' ? '-my-3 h-12' : '-my-2 h-10'
              )}
            >
              <span className="flex size-5 items-center justify-center [&>svg]:size-5 [&>img]:size-full [&>img]:object-contain">
                {start}
              </span>
            </FieldAddon>
          )}
          <span className="min-w-0 flex-1 wrap-anywhere text-pretty">
            <span className="block">{children}</span>
            {description != null && (
              <span className="block text-ui-14 text-ui-secondary">
                {description}
              </span>
            )}
          </span>
          {end != null && (
            <span className="ml-3 shrink-0 self-start text-ui-secondary">
              {end}
            </span>
          )}
        </>
      ),
    },
  })
}

/** Label for a group; the owning group connects it with aria-labelledby. */
export function ListRowHeader(
  props: ComponentPropsWithRef<'div'> & { size?: ListRowSize }
) {
  const { size = 'lg', className, ...restProps } = props
  return (
    <div
      {...restProps}
      className={cn(
        'py-2 text-ui-14 font-medium text-ui-secondary wrap-anywhere',
        size === 'lg' ? 'px-4' : 'px-3',
        className
      )}
    />
  )
}

/** Decorative boundary. It never enters the keyboard or option collection. */
export function ListRowSeparator(props: ComponentPropsWithRef<'div'>) {
  const { className, ...restProps } = props
  return (
    <div {...restProps} aria-hidden="true" className={cn('py-1', className)}>
      <div className="border-t border-ui-border" />
    </div>
  )
}
