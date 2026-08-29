import type { ReactNode, SVGProps } from 'react'
import { cn } from '../shadcn/utils'

/** Icon sizes in rem. */
const fontSizes = {
  inherit: 'text-[length:inherit]',
  small: 'text-[1.25rem]',
  medium: 'text-[1.5rem]',
  large: 'text-[2.1875rem]',
}

/** Icon colors mapped onto application tokens.
 *
 * `secondary` is the interactive brand color, exposed as
 * `interactive` — `--secondary` is the selected-surface token and would be
 * the wrong thing to paint a glyph with. */
const colors = {
  inherit: 'text-[color:inherit]',
  action: 'text-action-active',
  disabled: 'text-action-disabled',
  primary: 'text-primary',
  secondary: 'text-interactive',
  error: 'text-error',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
}

export type TIconProps = Omit<SVGProps<SVGSVGElement>, 'fontSize' | 'color'> & {
  fontSize?: keyof typeof fontSizes
  color?: keyof typeof colors
  /** Announced name. Without it the glyph stays `aria-hidden`, which is right
   * for an icon that only decorates a label that is already there. */
  titleAccess?: string
}

/** The shell both factories share: a `1em` box, size and color props, and paint
 * from `currentColor`. Only the drawing differs between outline and solid
 * glyphs. */
function createIcon(displayName: string, drawing: ReactNode) {
  function Icon({
    className,
    fontSize = 'medium',
    color = 'inherit',
    titleAccess,
    ...props
  }: TIconProps) {
    return (
      <svg
        focusable="false"
        aria-hidden={titleAccess ? undefined : true}
        role={titleAccess ? 'img' : undefined}
        viewBox="0 0 24 24"
        className={cn(
          'inline-block size-[1em] shrink-0 fill-current select-none',
          fontSizes[fontSize],
          colors[color],
          className
        )}
        {...props}
      >
        {titleAccess && <title>{titleAccess}</title>}
        {drawing}
      </svg>
    )
  }
  Icon.displayName = displayName
  return Icon
}

/** Builds a Feather-style icon: an outline drawn with a 1.5px round stroke and
 * no fill, which is how every glyph in the Feather set is described. */
export function createFeatherIcon(path: ReactNode, displayName: string) {
  return createIcon(
    displayName,
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </g>
  )
}

/** Builds a solid icon: a filled silhouette, which is how solid icons use the
 * few glyphs the Feather set has no equivalent for. The `fill-current` on the
 * shell paints it, so the path needs no attributes of its own. */
export function createSolidIcon(path: ReactNode, displayName: string) {
  return createIcon(displayName, path)
}
