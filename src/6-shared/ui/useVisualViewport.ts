import { useSyncExternalStore } from 'react'

type ViewportRect = { height: number; left: number; top: number; width: number }

// One subscription for the whole app. Every panel and drawer reads the same
// rectangle, so a keyboard opening wakes a single frame instead of one per
// consumer, and they all agree on the geometry within that frame.
const listeners = new Set<() => void>()
let snapshot = readVisualViewport()
let frame = 0

/** Shared visible-screen geometry. Consumers still own their own positioning. */
export function useVisualViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    const visual = window.visualViewport
    visual?.addEventListener('resize', update)
    visual?.addEventListener('scroll', update)
    // The screen may have changed while nobody was listening.
    update()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    cancelAnimationFrame(frame)
    const visual = window.visualViewport
    visual?.removeEventListener('resize', update)
    visual?.removeEventListener('scroll', update)
  }
}
function getSnapshot() {
  return snapshot
}
function getServerSnapshot(): ViewportRect | null {
  return null
}
function update() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const next = readVisualViewport()
    if (sameRect(snapshot, next)) return
    snapshot = next
    listeners.forEach(listener => listener())
  })
}
function readVisualViewport(): ViewportRect | null {
  if (typeof window === 'undefined' || !window.visualViewport) return null
  const { height, offsetLeft, offsetTop, width } = window.visualViewport
  return { height, left: offsetLeft, top: offsetTop, width }
}
function sameRect(a: ViewportRect | null, b: ViewportRect | null) {
  return (
    a?.height === b?.height &&
    a?.left === b?.left &&
    a?.top === b?.top &&
    a?.width === b?.width
  )
}
