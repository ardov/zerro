import './overlaySurface.css'

/** An anchored surface grows out of the corner it
 * hangs off, and fades while it does.
 *
 * `--grow-from`, `--grow-duration` and `--grow-origin` tune it, so a surface
 * that grows differently sets those next to the class instead of writing the
 * transition again. */
export const growSurfaceClass = 'popup-grow'

/** What every anchored surface hands the positioner. Only the side, the
 * alignment and the offset are the caller's. */
export const popupPositioning = {
  collisionPadding: 16,
  // No arrow, so no room reserved for one: the default 5px of arrow padding
  // shifts a menu opened at a point off that point.
  arrowPadding: 0,
  positionMethod: 'fixed',
  className: 'z-modal',
} as const

/** The surface every anchored overlay hangs from its anchor: `Popover` itself
 * and `AdaptivePopover` above the
 * mobile breakpoint.
 *
 * The 16px minimums and 32px viewport margin keep the paper within the
 * viewport. The paper does not scroll itself: its content scrolls in a
 * ScrollArea inside it, which fades the rows into the paper and leaves the
 * paper alone.
 *
 * Its entrance is slower and shallower than a menu's, and grows out of the
 * corner it hangs from rather than wherever collision handling left it: this
 * surface only ever shifts, it does not flip to another side. Which corner
 * that is depends on the alignment, so `--grow-origin` is set by `Popover`
 * and not here. */
export const anchoredSurfaceClass = `${growSurfaceClass} [--grow-duration:225ms] [--grow-from:0.9] flex min-h-4 min-w-4 max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-elevation-8 outline-none`

/** A surface that slides in off an edge: the adaptive popover on a phone.
 * `--drawer-radius` rounds its leading corners, and the
 * `data-placement` on the popup decides which corners those are. */
export const drawerSurfaceClass = 'drawer-slide'

/** The dim behind a drawer, which lifts as the drawer is swiped away. */
export const drawerBackdropClass = 'drawer-slide-backdrop'

/** Lay a surface's top-left over its anchor instead of beside it. */
export const overAnchor = ({ anchor }: { anchor: { height: number } }) =>
  -anchor.height
