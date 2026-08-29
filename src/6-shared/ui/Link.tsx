import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'

export type LinkProps = ComponentPropsWithoutRef<'a'> & {
  /** MUI's `underline`. `hover` is its default everywhere in this app. */
  underline?: 'always' | 'hover' | 'none'
}

/** MUI's `Link`: an anchor in the primary colour whose underline is drawn in
 * a fainter shade of itself until the pointer is on it. */
const linkBase =
  'cursor-pointer text-primary [-webkit-tap-highlight-color:transparent]'

/** The look without the anchor, for the one control that is a button doing a
 * link's job — MUI's `component="button"`, which brought a button reset with
 * it that the call site spells out. */
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
