import { useOverlayState } from './context'

/** Read the one ordered Screen map; paired owners can share its active region. */
export function useScreenOrder() {
  return Object.keys(useOverlayState().screens)
}

/** A paired surface owns both its list and Details ids. */
export function useIsTopScreen(...ids: (string | undefined)[]) {
  const top = useScreenOrder().at(-1)
  return top !== undefined && ids.includes(top)
}
