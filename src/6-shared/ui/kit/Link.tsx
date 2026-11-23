import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type LinkProps = ComponentPropsWithoutRef<'a'> & {
  /** Underline policy; defaults to always. */
  underline?: 'always' | 'hover' | 'none'
}

const linkBase =
  'cursor-pointer text-ui-link focusable [-webkit-tap-highlight-color:transparent]'

export function Link(props: LinkProps) {
  const { underline = 'always', className, ...restProps } = props
  return (
    <a
      data-slot="link"
      className={cn(
        linkBase,
        underline === 'none' && 'no-underline',
        underline === 'always' &&
          'underline decoration-ui-link/40 hover:decoration-[inherit]',
        underline === 'hover' && 'no-underline hover:underline',
        className
      )}
      {...restProps}
    />
  )
}
