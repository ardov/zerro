import { cn } from './shadcn/utils'
import './PressBacking.css'

export type PressBackingProps = {
  /** What the layer is painted with, and when — a resting fill, a
   * `group-hover:` highlight, or nothing at all on a row that only presses. */
  className?: string
}

/** The layer a row is coloured and pressed on.
 *
 * It sits behind the content at the row's own radius and carries the fill,
 * the hover highlight and the press. Stack two of them where the design
 * stacks two — a selected row keeps its fill and takes a highlight over it,
 * which is one translucent layer over another rather than a third colour
 * somebody has to mix.
 *
 * The host has to be `relative isolate` — the isolation is what lets the
 * layer sit at a negative depth behind the content without every child
 * having to position itself out of its way — and a `group` if any layer
 * reacts to the host's own hover. */
export function PressBacking({ className }: PressBackingProps) {
  return (
    <span
      aria-hidden
      data-slot="press-backing"
      className={cn(
        'press-backing pointer-events-none absolute inset-0 -z-10 rounded-[inherit]',
        className
      )}
    />
  )
}
