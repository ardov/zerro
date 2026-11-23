/** Pure overlay history rules: reconcile the current entry with live popup state. */

export type OverlayEntry = {
  /** Opening order comes from object keys. Integer-like names would reorder themselves to the bottom. */
  screens?: Record<string, unknown>
  /** A popup slot keeps the address and absorbs one Back press. */
  slots?: number
  /** Revisions let a live instance retain newer view state when Back restores
   * an earlier entry containing that same instance. They do not order layers. */
  revisions?: Record<string, number>
  /** Only step back from entries we pushed. Closing on a deep link must stay in the app. */
  ours?: boolean
}

export type OverlayRuntime = {
  popups: number
  stepping?: boolean
  /** The raw entry ended in an instance already removed as unavailable. */
  removedTop?: boolean
  closingThrough?: string
}

export type OverlayAction =
  | {
      kind: 'openScreen'
      name: string
      value: unknown
      /** This screen takes the place of the one that opened it, rather than
       * sitting on top of it. */
      instead?: boolean
    }
  | { kind: 'closeScreen'; name: string; through?: boolean }
  | { kind: 'updateScreen'; name: string; update: (value: unknown) => unknown }
  | { kind: 'removeScreen'; name: string }
  | { kind: 'openPopup' }
  | { kind: 'closePopup' }
  | { kind: 'arrive' }

export type HistoryOp =
  | { kind: 'push'; entry: OverlayEntry }
  | { kind: 'replace'; entry: OverlayEntry }
  | { kind: 'go'; delta: number }
  | { kind: 'none' }

export type Decision = {
  history: HistoryOp
  dismiss: number
  /** There is no answering this until the step in flight has landed. The host
   * holds the action and asks again then. */
  defer?: boolean
  complaint?: string
}

const nothing: Decision = { history: { kind: 'none' }, dismiss: 0 }

export function decide(
  entry: OverlayEntry,
  live: OverlayRuntime,
  action: OverlayAction
): Decision {
  const screens = entry.screens ?? {}
  const slots = entry.slots ?? 0

  // Defer writes until navigation lands; otherwise the departing entry loses them.
  if (live.stepping && action.kind !== 'arrive')
    return { ...nothing, defer: true }

  switch (action.kind) {
    case 'openScreen': {
      const next = action.instead ? withoutTop(screens) : { ...screens }
      next[action.name] = action.value
      // Push only when the old surface remains open. Without a screen to replace, instead must preserve the page entry.
      const handover =
        (!!action.instead && Object.keys(screens).length > 0) ||
        action.name in screens ||
        slots > 0
      return {
        history: {
          kind: handover ? 'replace' : 'push',
          // Replacing an entry preserves ownership; it cannot create a safe Back destination.
          entry: {
            ...entry,
            screens: next,
            slots: 0,
            ours: handover ? entry.ours : true,
          },
        },
        dismiss: live.popups,
      }
    }

    case 'removeScreen': {
      if (!(action.name in screens)) return nothing
      if (Object.keys(screens).at(-1) === action.name && entry.ours)
        return {
          history: { kind: 'go', delta: -(slots + 1) },
          dismiss: live.popups,
        }
      const next = { ...screens }
      delete next[action.name]
      return {
        history: { kind: 'replace', entry: { ...entry, screens: next } },
        dismiss: 0,
      }
    }

    case 'updateScreen': {
      if (!(action.name in screens)) return nothing
      const value = action.update(screens[action.name])
      if (Object.is(value, screens[action.name])) return nothing
      return {
        history: {
          kind: 'replace',
          entry: {
            ...entry,
            screens: { ...screens, [action.name]: value },
            revisions: {
              ...entry.revisions,
              [action.name]: (entry.revisions?.[action.name] ?? 0) + 1,
            },
          },
        },
        dismiss: 0,
      }
    }

    case 'closeScreen': {
      const names = Object.keys(screens)
      if (!names.includes(action.name))
        return { ...nothing, complaint: `Screen "${action.name}" is not open` }
      if (names[names.length - 1] !== action.name && !action.through)
        return {
          ...nothing,
          complaint: `Screen "${action.name}" is not the top one; close what is above it first`,
        }
      if (entry.ours)
        return {
          history: {
            kind: 'go',
            // Several screens can share one initial entry. Close groups one owned entry at a time.
            delta: -(slots + 1),
          },
          dismiss: live.popups,
        }
      const next = { ...screens }
      for (const name of action.through
        ? names.slice(names.indexOf(action.name))
        : [action.name])
        delete next[name]
      return {
        history: {
          kind: 'replace',
          entry: { ...entry, screens: next, slots: 0, ours: entry.ours },
        },
        dismiss: live.popups,
      }
    }

    case 'openPopup':
      return {
        history: {
          kind: 'push',
          entry: { ...entry, screens, slots: slots + 1, ours: true },
        },
        dismiss: 0,
      }

    // Closing a popup and landing on an entry are the same question asked at
    // different moments: does the history stack still match what is alive?
    case 'closePopup':
    case 'arrive':
      if (
        action.kind === 'arrive' &&
        live.closingThrough &&
        live.closingThrough in screens
      )
        return decide(entry, live, {
          kind: 'closeScreen',
          name: live.closingThrough,
          through: true,
        })
      if (action.kind === 'arrive' && live.removedTop && entry.ours)
        return {
          history: { kind: 'go', delta: -(slots + 1) },
          dismiss: live.popups,
        }
      return reconcile(slots, live.popups)
  }
}

/** Extra slots are dead history entries; extra live layers need dismissal after Back. */
function reconcile(slots: number, livePopups: number): Decision {
  if (slots > livePopups)
    return { history: { kind: 'go', delta: livePopups - slots }, dismiss: 0 }
  if (livePopups > slots) return { ...nothing, dismiss: livePopups - slots }
  return nothing
}

function withoutTop(screens: Record<string, unknown>) {
  const names = Object.keys(screens)
  const next = { ...screens }
  if (names.length) delete next[names[names.length - 1]]
  return next
}
