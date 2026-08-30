import './overlaySurface.css'

/** An anchored surface grows out of the corner it
 * hangs off, and fades while it does.
 *
 * `--grow-from`, `--grow-duration` and `--grow-origin` tune it, so a surface
 * that grows differently sets those next to the class instead of writing the
 * transition again. */
export const growSurfaceClass = 'popup-grow'

/** Shared paper for menus and select lists: their common elevation, radius and
 * 8px row inset are described once. */
export const overlaySurfaceClass = `${growSurfaceClass} max-h-[calc(100dvh-96px)] overflow-y-auto rounded-lg bg-popover py-2 text-popover-foreground shadow-elevation-8 outline-none`

/** What both of them hand the positioner. Only the side, the alignment and
 * the offset are the caller's, because those are what makes a menu a menu. */
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
 * The 16px minimums, clipped horizontal axis and 32px viewport margin keep the
 * paper within the viewport. An anchored paper only grows
 * downwards, so sideways overflow is a layout mistake rather than something
 * to scroll.
 *
 * Its entrance is slower and shallower than a menu's, and grows out of the
 * corner it hangs from rather than wherever collision handling left it: this
 * surface only ever shifts, it does not flip to another side. Which corner
 * that is depends on the alignment, so `--grow-origin` is set by `Popover`
 * and not here. */
export const anchoredSurfaceClass = `${growSurfaceClass} [--grow-duration:225ms] [--grow-from:0.9] min-h-4 min-w-4 max-h-[calc(100dvh-32px)] overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-elevation-8 outline-none`

/** A surface that slides in off an edge: the adaptive popover on a phone, and
 * `AdaptiveDialog` on one. `--drawer-radius` rounds its leading corners, and the
 * `data-placement` on the popup decides which corners those are. */
export const drawerSurfaceClass = 'drawer-slide'

/** The dim behind a drawer, which lifts as the drawer is swiped away. */
export const drawerBackdropClass = 'drawer-slide-backdrop'

/** Lay a surface's top-left over its anchor instead of beside it. */
export const overAnchor = ({ anchor }: { anchor: { height: number } }) =>
  -anchor.height
