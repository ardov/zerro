import { useOverlayMethods } from './context'

/** A system Back request targets the top history owner, not the surface
 * whose platform listener happened to receive it. Returns false when the
 * host has no overlay to dismiss. */
export function useOverlayBack() {
  return useOverlayMethods().back
}
