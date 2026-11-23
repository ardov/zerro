import { useOverlayMethods } from './context'

/** System Back targets the top history owner regardless of which platform listener receives it. */
export function useOverlayBack() {
  return useOverlayMethods().back
}
