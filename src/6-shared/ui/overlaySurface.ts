import './overlaySurface.css'

/** An anchored surface grows out of the corner it
 * hangs off, and fades while it does.
 *
 * `--grow-from`, `--grow-duration` and `--grow-origin` tune it, so a surface
 * that grows differently sets those next to the class instead of writing the
 * transition again. */
export const growSurfaceClass = 'popup-grow'

/** Shared paper for menus and select lists: their common elevation, radius
 * and 4px inset are described once.
 *
 * The radius is the rows' 12px plus that 4px, which is what keeps the two
 * curves concentric. The surface is also the scroller, so a list longer than
 * it runs under the padding and is clipped by the surface's own corners
 * rather than along a line 4px inside them. Pair it with `useScrollFade`. */
export const overlaySurfaceClass = `${growSurfaceClass} scroll-fade hidden-scroll max-h-[calc(100dvh-96px)] scroll-p-1 overflow-y-auto rounded-2xl bg-popover p-1 text-popover-foreground shadow-elevation-8 outline-none`

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
export const anchoredSurfaceClass = `${growSurfaceClass} scroll-fade hidden-scroll [--grow-duration:225ms] [--grow-from:0.9] min-h-4 min-w-4 max-h-[calc(100dvh-32px)] overflow-x-hidden overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-elevation-8 outline-none`

/** A surface that slides in off an edge: the adaptive popover on a phone, and
 * `AdaptiveDialog` on one. `--drawer-radius` rounds its leading corners, and the
 * `data-placement` on the popup decides which corners those are. */
export const drawerSurfaceClass = 'drawer-slide'

/** The dim behind a drawer, which lifts as the drawer is swiped away. */
export const drawerBackdropClass = 'drawer-slide-backdrop'

/** Lay a surface's top-left over its anchor instead of beside it. */
export const overAnchor = ({ anchor }: { anchor: { height: number } }) =>
  -anchor.height

/** The inset a list surface keeps around its rows.
 *
 * A surface laid over a field takes it off both offsets, so the first row's
 * text lands exactly where the field's was rather than 4px in from it. It is
 * a number rather than a class because the positioner is given pixels. */
export const surfacePadding = 4
