/**
 * In-memory key/value store for transient view state (scroll position, filters)
 * that should survive navigating away and back within a session, but not a page
 * reload. It's just a module-level Map — no serialization, no persistence.
 */

const store = new Map<string, unknown>()

export function loadMemory<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function saveMemory(key: string, value: unknown): void {
  store.set(key, value)
}
