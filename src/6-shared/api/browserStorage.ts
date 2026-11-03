// Remember successful reads/writes for later read failures. Only unsaved
// changes override readable browser storage, so cross-tab changes stay visible.
// Null values preserve removals even when browser persistence is unavailable.
const lastKnown = new Map<string, string | null>()
const unsaved = new Set<string>()
let cleared = false

/** Best-effort persistence with a fallback lasting only for this page. */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (unsaved.has(key) || cleared) return lastKnown.get(key) ?? null
    try {
      const value = localStorage.getItem(key)
      lastKnown.set(key, value)
      return value
    } catch {
      return lastKnown.get(key) ?? null
    }
  },
  setItem(key: string, value: string): void {
    lastKnown.set(key, value)
    unsaved.add(key)
    try {
      localStorage.setItem(key, value)
      unsaved.delete(key)
    } catch {
      // Keep the unsaved value for the current page.
    }
  },
  removeItem(key: string): void {
    lastKnown.set(key, null)
    unsaved.add(key)
    try {
      localStorage.removeItem(key)
      unsaved.delete(key)
    } catch {
      // Keep the removal for the current page.
    }
  },
  clear(): void {
    lastKnown.clear()
    unsaved.clear()
    cleared = true
    try {
      localStorage.clear()
      cleared = false
    } catch {
      // Values already read from the browser must stay cleared in this page.
    }
  },
}
