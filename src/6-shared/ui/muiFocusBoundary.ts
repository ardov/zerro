/** The one place that reaches into MUI's DOM.
 *
 * While both libraries ship, a Base UI surface opened from inside a MUI
 * dialog or drawer has to be portalled into that parent — assignment opened
 * from the envelope detail drawer, for example — or MUI's focus trap pulls
 * focus straight back out of it.
 *
 * This exists to be deleted: once the last MUI overlay is converted, drop the
 * file and the `container` it feeds. Keeping the class-name sniffing in one
 * named function rather than inline in `AdaptivePopover` is what makes that a
 * single removal instead of a search.
 */
export function findMuiFocusBoundary(anchor: Element | null | undefined) {
  // A detached anchor — the list re-rendered while the surface was open —
  // would hand back a detached container and portal the surface into nothing.
  if (!anchor?.isConnected) return undefined
  return (
    anchor.closest<HTMLElement>('[role="dialog"], .MuiDrawer-paper') ??
    undefined
  )
}
