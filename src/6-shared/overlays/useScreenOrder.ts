import { useOverlayState } from './context'

/** Read the one ordered Screen map; paired owners can share its active region. */
export function useScreenOrder() {
  return Object.keys(useOverlayState().screens)
}
