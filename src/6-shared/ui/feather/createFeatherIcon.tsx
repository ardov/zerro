import type { ReactNode, SVGProps } from 'react'
import { cn } from '../shadcn/utils'

/** MUI's `SvgIcon` sizes, in the rem values it uses. */
const fontSizes = {
  inherit: 'text-[length:inherit]',
  small: 'text-[1.25rem]',
  medium: 'text-[1.5rem]',
  large: 'text-[2.1875rem]',
}

/** MUI's `SvgIcon` palette colors, mapped onto this app's tokens.
 *
 * `secondary` is MUI's secondary brand color, which this app exposes as
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

/** Builds a Feather-style icon component.
 *
 * The output matches what MUI's `createSvgIcon` produced for these glyphs —
 * `1em` box, `fontSize`/`color` props, stroke from `currentColor` — so call
 * sites did not have to change when the factory stopped being MUI's. */
export function createFeatherIcon(path: ReactNode, displayName: string) {
  function FeatherIcon({
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
        data-testid={`${displayName}Icon`}
        className={cn(
          'inline-block size-[1em] shrink-0 fill-current select-none',
          fontSizes[fontSize],
          colors[color],
          className
        )}
        {...props}
      >
        {titleAccess && <title>{titleAccess}</title>}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {path}
        </g>
      </svg>
    )
  }
  FeatherIcon.displayName = displayName
  return FeatherIcon
}
