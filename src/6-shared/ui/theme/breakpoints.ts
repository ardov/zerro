/** The app's breakpoints, in pixels.
 *
 * Single source of truth. The MUI theme is built from this map, the
 * `useBreakpointDown` hook queries it, and `src/tailwind.css` mirrors the same
 * numbers for Tailwind's own variants — in pixels, not Tailwind's usual `rem`,
 * so the mirror cannot drift from the pixel queries the other two run whenever
 * the root font size is not 16px. `breakpoints.test.ts` checks that mirror. */
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const

export type TBreakpoint = keyof typeof breakpoints

/** `xs` is 0, so a query below it can never match. MUI still needs the value
 * in its scale, but nothing should ask to be under it. */
export type TBreakpointDown = Exclude<TBreakpoint, 'xs'>

/** MUI subtracts 0.05px from the breakpoint for its `down` queries.
 * Reproduced here so owned and MUI components switch on the same pixel. */
export function mediaQueryDown(key: TBreakpointDown) {
  return `(max-width: ${breakpoints[key] - 0.05}px)`
}
