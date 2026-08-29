import './popupSurface.css'

/** The entrance legacy UI gives an anchored surface: it grows out of the corner it
 * hangs off, and fades while it does.
 *
 * `--grow-from`, `--grow-duration` and `--grow-origin` tune it, so a surface
 * that grows differently sets those next to the class instead of writing the
 * transition again. */
export const growSurfaceClass = 'owned-grow'

/** The paper legacy UI drops out of a control. The menu and the select's list are
 * the same surface — same elevation, same radius, same 8px the rows sit in —
 * so it is described once, the way `listRowClass` describes their rows. */
export const popupSurfaceClass = `${growSurfaceClass} max-h-[calc(100dvh-96px)] overflow-y-auto rounded-lg bg-popover py-2 text-popover-foreground shadow-elevation-8 outline-none`

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

/** legacy UI's `Popover` paper, which is the surface every anchored overlay of ours
 * hangs off its anchor: `Popover` itself, and `AdaptivePopover` above the
 * mobile breakpoint.
 *
 * The 16px minimums, the clipped horizontal axis and the 32px the paper keeps
 * off the viewport are legacy UI's own — an anchored paper only ever grows
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
 * `SmartDialog` on one. `--drawer-radius` rounds its leading corners, and the
 * `data-placement` on the popup decides which corners those are. */
export const drawerSurfaceClass = 'owned-drawer'

/** The dim behind a drawer, which lifts as the drawer is swiped away. */
export const drawerBackdropClass = 'owned-drawer-backdrop'

/** legacy UI lays an anchored surface's top-left over the anchor's own. Base UI
 * pushes it clear of the anchor instead, so the height comes back off. */
export const overAnchor = ({ anchor }: { anchor: { height: number } }) =>
  -anchor.height
