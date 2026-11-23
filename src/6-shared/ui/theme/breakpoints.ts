/** Mirror these pixel values in src/tailwind.css. The breakpoint test checks both sources agree. */
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

/** Stop short so the down query and its Tailwind variant cannot both match at the breakpoint. */
export function mediaQueryDown(key: TBreakpointDown) {
  return `(max-width: ${breakpoints[key] - 0.05}px)`
}
