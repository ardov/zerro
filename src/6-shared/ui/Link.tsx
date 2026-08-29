import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'

export type LinkProps = ComponentPropsWithoutRef<'a'> & {
  /** Underline policy; `hover` is the application default. */
  underline?: 'always' | 'hover' | 'none'
}

/** An anchor in the primary color whose underline is drawn in
 * a fainter shade of itself until the pointer is on it. */
const linkBase =
  'cursor-pointer text-primary [-webkit-tap-highlight-color:transparent]'

/** Link styling without the anchor, for the control that uses button semantics. */
export const linkClass = `${linkBase} underline decoration-link-underline hover:decoration-[inherit]`

export function Link({ underline = 'always', className, ...props }: LinkProps) {
  return (
    <a
      data-slot="link"
      className={cn(
        linkBase,
        underline === 'none' && 'no-underline',
        // The fainter shade belongs to the underline that is always there.
        // One that only appears on hover is drawn in the text's own colour,
        // because there is nothing to distinguish it from at rest.
        underline === 'always' &&
          'underline decoration-link-underline hover:decoration-[inherit]',
        underline === 'hover' && 'no-underline hover:underline',
        className
      )}
      {...props}
    />
  )
}
