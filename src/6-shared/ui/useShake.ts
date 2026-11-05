import { useCallback, useRef } from 'react'

/** How far and how long. Small and quick: this is a refusal, not an alarm. */
const KEYFRAMES = [0, -6, 6, -4, 4, 0].map(x => ({
  transform: `translateX(${x}px)`,
}))

/** Shakes an element to say no */
export function useShake<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const shake = useCallback(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    node.animate(KEYFRAMES, { duration: 350, easing: 'ease-in-out' })
  }, [])
  return [ref, shake] as const
}
