import type { ReactNode } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from './shadcn/utils'

/** Shared reset for a native button with every user-agent decoration removed.
 *
 * It deliberately declares neither `padding` nor `border-width`: both are
 * decided per variant below, and a reset that set them would leave two classes
 * fighting over one property with only Tailwind's emission order to separate
 * them. Every caller of RESET adds exactly one of each. */
const RESET =
  'relative m-0 box-border inline-flex cursor-pointer items-center justify-center bg-transparent align-middle no-underline outline-0 select-none disabled:pointer-events-none disabled:cursor-default'

/** The one place each variant's border width is declared. */
const borders = {
  text: 'border-0',
  contained: 'border-0',
  outlined: 'border border-solid',
}

/** Button typography under the application theme.
 *
 * IBM Plex Sans uses no added tracking here, and labels keep their authored
 * capitalization.
 *
 * Size and line height ride in one `text-<size>/<leading>` utility because
 * tailwind-merge treats `font-size` as conflicting with `leading` — the
 * `text-sm/6` shorthand is why — so a later size class written on its own
 * silently deletes an earlier `leading-*` and the button loses its height. */
const TYPOGRAPHY = 'font-sans text-sm/[1.75] font-medium'

/** Padding is a function of both variant and size — an outlined button carries
 * a border and takes a pixel off each edge to keep the same box. */
const geometry = {
  text: {
    small: 'px-[5px] py-1 text-[0.8125rem]/[1.75]',
    medium: 'px-2 py-1.5',
    large: 'px-[11px] py-2 text-[0.9375rem]/[1.75]',
  },
  contained: {
    small: 'px-2.5 py-1 text-[0.8125rem]/[1.75]',
    medium: 'px-4 py-1.5',
    large: 'px-[22px] py-2 text-[0.9375rem]/[1.75]',
  },
  outlined: {
    small: 'px-[9px] py-[3px] text-[0.8125rem]/[1.75]',
    medium: 'px-[15px] py-[5px]',
    large: 'px-[21px] py-[7px] text-[0.9375rem]/[1.75]',
  },
}

/** Only the variant and color pairs the app renders; this table is the contract.
 *
 * `Button.stories.tsx` builds its variant matrix from this object. A pair a
 * call site asks for but nothing implements falls back to the variant's
 * primary color rather than rendering unstyled. */
export const buttonPalettes = {
  text: {
    primary: 'text-primary hover:bg-primary-hover',
    secondary: 'text-interactive hover:bg-interactive-hover',
    inherit: 'text-inherit hover:bg-foreground-hover',
  },
  contained: {
    primary:
      'bg-primary text-primary-foreground shadow-elevation-2 hover:bg-primary-solid-hover hover:shadow-elevation-4 focus-visible:shadow-elevation-6 active:shadow-elevation-8 disabled:bg-disabled-background disabled:shadow-none',
  },
  outlined: {
    primary:
      'border-primary-border text-primary hover:border-primary hover:bg-primary-hover disabled:border-disabled-background',
    error:
      'border-error-border text-error hover:border-error hover:bg-error-hover disabled:border-disabled-background',
  },
}

/** Pull a start icon back over the button's own padding. */
const startIconOffset = { small: '-ml-0.5', medium: '-ml-1', large: '-ml-1' }

type TSize = 'small' | 'medium' | 'large'

/** `variant` and `color` are separate props rather than a discriminated union
 * of the implemented pairs. A call site that picks its variant with a ternary
 * hands over `'contained' | 'outlined'` in one prop, and TypeScript will not
 * distribute that across union members. `buttonPalettes` is the contract, and
 * the story matrix walks it. */
export type ButtonProps = Omit<ButtonPrimitive.Props, 'className' | 'color'> & {
  className?: string
  variant?: keyof typeof buttonPalettes
  color?: 'primary' | 'secondary' | 'inherit' | 'error'
  size?: TSize
  fullWidth?: boolean
  startIcon?: ReactNode
}

/** Button for the surface this app uses.
 *
 * It shows a real focus ring instead of relying on a ripple. */
export function Button({
  className,
  size = 'medium',
  fullWidth,
  startIcon,
  children,
  ...props
}: ButtonProps) {
  const { variant = 'text', color = 'primary', ...rest } = props
  const paints: Record<string, string> = buttonPalettes[variant]
  const paint = paints[color] ?? paints.primary
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        RESET,
        TYPOGRAPHY,
        'min-w-16 rounded-lg transition-[background-color,box-shadow,border-color,color] duration-250 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:text-disabled-control-foreground',
        borders[variant],
        geometry[variant][size],
        paint,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {startIcon && (
        /* No icon sizing here: every icon carries its own Tailwind size utility,
           so the glyph keeps the size it declares. */
        <span
          className={cn(
            'mr-2 inline-flex shrink-0 items-center',
            startIconOffset[size]
          )}
        >
          {startIcon}
        </span>
      )}
      {children}
    </ButtonPrimitive>
  )
}

/** Padding, not a fixed box: the icon button is sized by what it wraps, so a
 * larger glyph makes a larger button. */
const iconGeometry = {
  small: 'p-[5px] text-[1.125rem]',
  // `text-[1.5rem]`, not `text-2xl`: the named size carries a line height with
  // it, while this geometry sets only the font size.
  medium: 'p-2 text-[1.5rem]',
}

const iconPalettes = {
  default: 'text-icon-foreground hover:bg-accent',
  inherit: 'text-inherit hover:bg-accent',
  primary: 'text-primary hover:bg-primary-hover',
}

/** Pull a small button back by 3px and a medium one by 12px, because the
 * padding it is cancelling differs. */
const edges = {
  start: { small: '-ml-[3px]', medium: '-ml-3' },
  end: { small: '-mr-[3px]', medium: '-mr-3' },
}

export type IconButtonProps = Omit<
  ButtonPrimitive.Props,
  'className' | 'color'
> & {
  className?: string
  size?: 'small' | 'medium'
  color?: keyof typeof iconPalettes
  /** Pulls the button back over the padding of the field or bar it sits in,
   * so the icon lines up with the edge. */
  edge?: 'start' | 'end'
}

export function IconButton({
  className,
  size = 'medium',
  color = 'default',
  edge,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(
        RESET,
        'border-0 shrink-0 rounded-full text-center transition-colors duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-transparent disabled:text-disabled-control-foreground',
        iconGeometry[size],
        iconPalettes[color],
        edge && edges[edge][size],
        className
      )}
      {...props}
    />
  )
}

export type ButtonBaseProps = Omit<ButtonPrimitive.Props, 'className'> & {
  className?: string
}

/** A reset native button for call sites that bring their own styling. */
export function ButtonBase({ className, ...props }: ButtonBaseProps) {
  return (
    <ButtonPrimitive
      data-slot="button-base"
      className={cn(RESET, 'border-0 p-0', className)}
      {...props}
    />
  )
}
