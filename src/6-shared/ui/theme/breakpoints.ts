/** The app's breakpoints, in pixels.
 *
 * Single source of truth. The `useBreakpointDown` hook queries this map, and
 * `src/tailwind.css` mirrors the same numbers for Tailwind's own variants — in
 * pixels, not Tailwind's usual `rem`, so the mirror cannot drift from the pixel
 * queries the hook runs whenever the root font size is not 16px.
 * `breakpoints.test.ts` checks that mirror. */
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const

export type TBreakpoint = keyof typeof breakpoints

/** `xs` is 0, so a query below it can never match: nothing should ask to be
 * under it. It stays in the map because it is the bottom of the scale. */
export type TBreakpointDown = Exclude<TBreakpoint, 'xs'>

/** Stops 0.05px short of the breakpoint, which is legacy UI's arithmetic, kept so
 * that a `down` query and the Tailwind variant of the same name cannot both
 * match on the breakpoint pixel itself. */
export function mediaQueryDown(key: TBreakpointDown) {
  return `(max-width: ${breakpoints[key] - 0.05}px)`
}
