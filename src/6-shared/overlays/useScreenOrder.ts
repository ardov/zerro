import { useOverlayState } from './context'

export function useScreenOrder() {
  return Object.keys(useOverlayState().screens)
}

export function useIsTopScreen(...ids: (string | undefined)[]) {
  const top = useScreenOrder().at(-1)
  return top !== undefined && ids.includes(top)
}
