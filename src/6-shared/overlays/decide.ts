/** The whole arithmetic of overlays and browser history, as one function.
 *
 * Every decision about the history stack is taken here and nowhere else:
 * `OverlayHost` only feeds it the two things it needs and carries out the
 * answer. The bugs this replaces all came from the same shape — the same fact
 * written down in two places that drifted apart — so both places are inputs to
 * one function instead, and there is nothing left to drift.
 *
 * Nothing here touches React, the router or the browser, so the rules can be
 * exercised directly, a reload included: a reload is just an entry that says
 * two popups with no live layer to match. */

/** What one history entry records. It rides in `location.state`, which React
 * Router keeps in `history.state` — so it survives a reload. */
export type OverlayEntry = {
  /** Open screens and the values that describe them, in opening order: the
   * last one is on top. */
  screens?: Record<string, unknown>
  /** How many popup slots have piled up on this entry. A slot changes no
   * address; it exists to absorb one Back press. */
  popups?: number
  /** We pushed this entry ourselves. A first entry of a session — a typed
   * address, a shared link — has no state at all, and closing an overlay there
   * must not step out of the app. */
  ours?: boolean
}

/** The overlays actually alive in memory. Screens are not here: they are read
 * back from the entry, which is the whole point of them. */
export type LiveLayers = { popups: number }

export type OverlayAction =
  | {
      kind: 'openScreen'
      name: string
      value: unknown
      /** This screen takes the place of the one that opened it, rather than
       * sitting on top of it. */
      instead?: boolean
    }
  | { kind: 'closeScreen'; name: string }
  | { kind: 'openPopup' }
  | { kind: 'closePopup' }
  /** We have landed on an entry — mounted, navigated, went back, reloaded. */
  | { kind: 'arrive' }

export type HistoryOp =
  | { kind: 'push'; entry: OverlayEntry }
  | { kind: 'replace'; entry: OverlayEntry }
  | { kind: 'go'; delta: number }
  | { kind: 'none' }

export type Decision = {
  history: HistoryOp
  /** How many live popup layers the host must drop from memory. */
  dismiss: number
  /** Set when the call was a programming error rather than a thing to do. */
  complaint?: string
}

const nothing: Decision = { history: { kind: 'none' }, dismiss: 0 }

export function decide(
  entry: OverlayEntry,
  live: LiveLayers,
  action: OverlayAction
): Decision {
  const screens = entry.screens ?? {}
  const slots = entry.popups ?? 0

  switch (action.kind) {
    case 'openScreen': {
      const next = action.instead ? withoutTop(screens) : { ...screens }
      next[action.name] = action.value
      // Push only when what is open now stays open under the new screen.
      // Three ways it does not: the screen replaces itself (one transaction
      // handing over to the next), it takes over from a popup (the settings
      // menu opening the history panel), or the caller says so outright.
      const handover = !!action.instead || action.name in screens || slots > 0
      return {
        history: {
          kind: handover ? 'replace' : 'push',
          entry: { screens: next, popups: 0, ours: true },
        },
        dismiss: live.popups,
      }
    }

    case 'closeScreen': {
      const names = Object.keys(screens)
      if (!names.includes(action.name))
        return { ...nothing, complaint: `Screen "${action.name}" is not open` }
      if (names[names.length - 1] !== action.name)
        return {
          ...nothing,
          complaint: `Screen "${action.name}" is not the top one; close what is above it first`,
        }
      // Stepping off the screen's own entry also unwinds any popup slots that
      // piled on top of it.
      if (entry.ours)
        return {
          history: { kind: 'go', delta: -(slots + 1) },
          dismiss: live.popups,
        }
      // Never pushed by us, so there is nothing behind to go back to: swap the
      // screen out of the address instead of stepping out of the app.
      const next = { ...screens }
      delete next[action.name]
      return {
        history: {
          kind: 'replace',
          entry: { screens: next, popups: 0, ours: entry.ours },
        },
        dismiss: live.popups,
      }
    }

    case 'openPopup':
      return {
        history: {
          kind: 'push',
          entry: { screens, popups: slots + 1, ours: true },
        },
        dismiss: 0,
      }

    // Closing a popup and landing on an entry are the same question asked at
    // different moments: does the history stack still match what is alive?
    case 'closePopup':
    case 'arrive':
      return reconcile(slots, live.popups)
  }
}

/** More slots than live layers means slots to unwind — a reload on an open
 * menu, a Forward onto a spent slot, a popup just closed. Fewer means Back has
 * uncovered a layer that memory still holds, so memory gives it up. */
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
