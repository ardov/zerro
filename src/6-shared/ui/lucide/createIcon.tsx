import type { LucideIcon, LucideProps } from 'lucide-react'
import { cn } from '../shadcn/utils'

/** Lucide's absoluteStrokeWidth preserves weight across pixel sizes. Add semantic exports in ./index. */

/** Use the standard pixel sizes for controls; decorative icons can override dimensions with className. */
export type TIconSize = 16 | 20 | 24

export type TIconProps = Omit<
  LucideProps,
  'size' | 'absoluteStrokeWidth' | 'strokeWidth'
> & {
  size?: TIconSize
  /** Strokes stay at 1.5px by default at every icon size. */
  strokeWidth?: number
  /** Announced name. Without it the icon stays `aria-hidden`, which is right
   * for one that only decorates a label already there. */
  titleAccess?: string
}

export function createIcon(Source: LucideIcon, displayName: string) {
  function Icon({
    size = 20,
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
