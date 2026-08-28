import './popupSurface.css'

/** The entrance MUI gives an anchored surface: it grows out of the corner it
 * hangs off, and fades while it does.
 *
 * `--grow-from`, `--grow-duration` and `--grow-origin` tune it, so a surface
 * that grows differently sets those next to the class instead of writing the
 * transition again. */
export const growSurfaceClass = 'owned-grow'

/** The paper MUI drops out of a control. The menu and the select's list are
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

/** A surface that slides in off an edge: the adaptive popover on a phone, and
 * `SmartDialog` on one. `--drawer-radius` rounds its leading corners, and the
 * `data-placement` on the popup decides which corners those are. */
export const drawerSurfaceClass = 'owned-drawer'

/** The dim behind a drawer, which lifts as the drawer is swiped away. */
export const drawerBackdropClass = 'owned-drawer-backdrop'

/** MUI lays an anchored surface's top-left over the anchor's own. Base UI
 * pushes it clear of the anchor instead, so the height comes back off. */
export const overAnchor = ({ anchor }: { anchor: { height: number } }) =>
  -anchor.height
