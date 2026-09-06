import type { LucideIcon, LucideProps } from 'lucide-react'
import { cn } from '../shadcn/utils'

/** The interface's icons, drawn from the Lucide set.
 *
 * Two things make this a system rather than a pile of SVGs. Icons are
 * measured in pixels, not in ems: the surfaces that place them put them on a
 * pixel grid — 20px beside a field's text, 16px for the cross on a chip — and
 * an icon that quietly followed the font size would land between the lines of
 * that grid. And the stroke is held at a fixed device width whatever the size,
 * so a 16px icon is not drawn a third thinner than the 20px one beside it.
 * `absoluteStrokeWidth` is what does the second part; without it Lucide scales
 * the stroke with the box.
 *
 * Add a semantically named export to `./index` rather than importing
 * `lucide-react` from feature code: the name says what the icon means here, so
 * changing the drawing later is one edit in one file.
 */

/** The three sizes the interface places icons at, in pixels. Anything else is
 * a decorative one-off and sizes itself through `className`, where the CSS
 * beats the width and height Lucide writes as attributes. */
export type TIconSize = 16 | 20 | 24

export type TIconProps = Omit<
  LucideProps,
  'size' | 'absoluteStrokeWidth' | 'strokeWidth'
> & {
  size?: TIconSize
  /** Stroke width in device pixels, held at that width at every size. A prop
   * rather than a constant because a few surfaces want a heavier line — but
   * 1.5 is what the interface is drawn with, so passing it is a decision. */
  strokeWidth?: number
  /** Announced name. Without it the icon stays `aria-hidden`, which is right
   * for one that only decorates a label already there. */
  titleAccess?: string
}

export function createIcon(Source: LucideIcon, displayName: string) {
  function Icon({
    size = 24,
    strokeWidth = 1.5,
    className,
    titleAccess,
    ...props
  }: TIconProps) {
    return (
      <Source
        size={size}
        strokeWidth={strokeWidth}
        absoluteStrokeWidth
        aria-hidden={titleAccess ? undefined : true}
        role={titleAccess ? 'img' : undefined}
        className={cn('shrink-0', className)}
        {...props}
      >
        {titleAccess ? <title>{titleAccess}</title> : null}
      </Source>
    )
  }
  Icon.displayName = displayName
  return Icon
}
