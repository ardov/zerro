import { describe, expect, it } from 'vitest'
import type { Decision, HistoryOp, OverlayAction, OverlayEntry } from './decide'
import { decide } from './decide'

/** No decision to carry out. */
const nothing: Decision = { history: { kind: 'none' }, dismiss: 0 }

/** A history stack plus the app's live popup layers, driven exactly the way
 * `OverlayHost` drives them. Scenarios below read as a person's session:
 * open, press Back, reload. */
function session(
  initial: OverlayEntry = {},
  /** Hold every step the way a browser does, until `land` is called. A real
   * one takes several frames over it, which is long enough for a surface to
   * open in the meantime. */
  { holdSteps = false } = {}
) {
  const entries: OverlayEntry[] = [initial]
  let idx = 0
  let live = 0
  let held: number | null = null
  /** Actions `decide` told us to hold until the step has landed. */
  const pending: OverlayAction[] = []

  function entry() {
    return entries[idx]
  }

  function layers() {
    return { popups: live, stepping: held !== null }
  }

  function ask(action: OverlayAction): Decision {
    const decision = decide(entry(), layers(), action)
    // The host holds what it is told to hold and asks again on the landing.
    if (decision.defer) {
      pending.push(action)
      return decision
    }
    live -= decision.dismiss
    carry(decision.history)
    return decision
  }

  function carry(op: HistoryOp) {
    if (op.kind === 'push') {
      entries.splice(idx + 1)
      entries.push(op.entry)
      idx++
    }
    if (op.kind === 'replace') entries[idx] = op.entry
    if (op.kind === 'go') {
      held = op.delta
      if (!holdSteps) land()
    }
  }

  /** The step the browser was asked for, arriving. */
  function land() {
    if (held === null) return
    idx += held
    held = null
    settle()
  }

  /** What the host's effect does on every landing: carry out what was held,
   * then reconcile until still. */
  function settle() {
    for (let guard = 0; guard < 10; guard++) {
      if (pending.length) {
        ask(pending.shift() as OverlayAction)
        if (held !== null) return
        continue
      }
      const decision = decide(entry(), layers(), { kind: 'arrive' })
      live -= decision.dismiss
      if (decision.history.kind === 'none') return
      carry(decision.history)
      if (held !== null) return
    }
    throw new Error('arrive did not settle')
  }

  return {
    get entry() {
      return entry()
    },
    get live() {
      return live
    },
    get depth() {
      return idx
    },
    get screens() {
      return entry().screens ?? {}
    },
    openScreen: (name: string, value: unknown, instead?: boolean) =>
      ask({ kind: 'openScreen', name, value, instead }),
    closeScreen: (name: string) => ask({ kind: 'closeScreen', name }),
    openPopup() {
      live++
      return ask({ kind: 'openPopup' })
    },
    closePopup() {
      // The host closes a layer by id and ignores one already dismissed.
      if (live === 0) return nothing
      live--
      return ask({ kind: 'closePopup' })
    },
    /** The step the browser was asked for, arriving. */
    land,
    /** The browser's Back button. */
    back() {
      if (idx === 0) throw new Error('Back would have left the app')
      idx--
      settle()
    },
    /** Leaving for another page: a plain push with no overlay state. */
    goToPage() {
      entries.splice(idx + 1)
      entries.push({})
      idx++
      settle()
    },
    /** Reload drops everything held in memory; history survives. */
    reload() {
      live = 0
      settle()
    },
  }
}

describe('R1 — a history entry for each overlay that is open', () => {
  it('pushes when the page stays open under the screen', () => {
    const s = session()
    s.openScreen('tr', 'a')
    expect(s.depth).toBe(1)
    expect(s.screens).toEqual({ tr: 'a' })
  })

  it('replaces when a screen hands over to the same screen', () => {
    const s = session()
    s.openScreen('tr', 'a')
    s.openScreen('tr', 'b')
    expect(s.depth).toBe(1)
    expect(s.screens).toEqual({ tr: 'b' })
  })

  it('leaves ten transactions one Back away from the page', () => {
    const s = session()
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])
      s.openScreen('tr', id)
    expect(s.depth).toBe(1)
    s.back()
    expect(s.screens).toEqual({})
    expect(s.depth).toBe(0)
  })

  it('pushes when the screen underneath stays visible', () => {
    const s = session()
    s.openScreen('env', 'abc')
    s.openScreen('envEdit', true)
    expect(s.depth).toBe(2)
    expect(s.screens).toEqual({ env: 'abc', envEdit: true })
    s.back()
    expect(s.screens).toEqual({ env: 'abc' })
  })

  it('replaces when a screen hands its place to another screen', () => {
    const s = session()
    s.openScreen('env', 'abc')
    s.openScreen('envTx', { id: 'abc' }, true)
    expect(s.depth).toBe(1)
    expect(s.screens).toEqual({ envTx: { id: 'abc' } })
    s.back()
    expect(s.screens).toEqual({})
  })

  it('gives a popup its own entry without touching the address', () => {
    const s = session()
    s.openScreen('env', 'abc')
    s.openPopup()
    expect(s.depth).toBe(2)
    expect(s.entry.slots).toBe(1)
    expect(s.screens).toEqual({ env: 'abc' })
  })

  it('stacks a popup on a popup, one entry each', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    expect(s.depth).toBe(2)
    expect(s.entry.slots).toBe(2)
  })
})

describe('R1 — a screen opened from a popup takes its place', () => {
  it('replaces the popup slot and dismisses it', () => {
    const s = session()
    s.openPopup()
    const decision = s.openScreen('history', true)
    expect(decision.dismiss).toBe(1)
    expect(s.live).toBe(0)
    expect(s.depth).toBe(1)
    expect(s.entry.slots).toBe(0)
    expect(s.screens).toEqual({ history: true })
  })

  it('leads Back to the page rather than back into the menu', () => {
    const s = session()
    s.openPopup()
    s.openScreen('history', true)
    s.back()
    expect(s.screens).toEqual({})
    expect(s.depth).toBe(0)
  })

  it('cleans up the slots left below when several popups were stacked', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    s.openScreen('history', true)
    expect(s.live).toBe(0)
    s.back()
    expect(s.screens).toEqual({})
    expect(s.depth).toBe(0)
  })
})

describe('R2 — closing is returning to the previous address', () => {
  it('steps back when the entry is one we pushed', () => {
    const s = session()
    s.openScreen('tr', 'a')
    const decision = s.closeScreen('tr')
    expect(decision.history).toEqual({ kind: 'go', delta: -1 })
    expect(s.depth).toBe(0)
  })

  it('replaces instead of leaving the app when we never pushed the entry', () => {
    const s = session({ screens: { tr: 'a' } })
    const decision = s.closeScreen('tr')
    expect(decision.history.kind).toBe('replace')
    expect(s.depth).toBe(0)
    expect(s.screens).toEqual({})
  })

  it('closes a popup by stepping off its own slot', () => {
    const s = session()
    s.openPopup()
    const decision = s.closePopup()
    expect(decision.history).toEqual({ kind: 'go', delta: -1 })
    expect(s.depth).toBe(0)
    expect(s.live).toBe(0)
  })

  it('does not step back when the address moved on since the popup opened', () => {
    const s = session()
    s.openPopup()
    s.goToPage()
    expect(s.live).toBe(0)
    const decision = s.closePopup()
    expect(decision.history).toEqual({ kind: 'none' })
  })
})

describe('one surface handing over to another, while the step is in flight', () => {
  it('keeps the popup that opened before the step landed', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup() // the filter bar's menu
    s.closePopup() // a filter is picked, so the menu closes
    s.openPopup() // and the clause editor opens in its place
    expect(s.live).toBe(1)

    s.land()
    // The editor is still open, and it has a slot of its own to be closed by.
    expect(s.live).toBe(1)
    expect(s.entry.slots).toBe(1)
  })

  it('leaves Back closing the popup rather than the page', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup()
    s.closePopup()
    s.openPopup()
    s.land()

    s.back()
    expect(s.live).toBe(0)
    expect(s.depth).toBe(0)
  })

  it('settles to nothing when no popup took the place of the menu', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup()
    s.closePopup()
    s.land()
    expect(s.live).toBe(0)
    expect(s.depth).toBe(0)
    expect(s.entry.slots ?? 0).toBe(0)
  })

  it('gives each popup of a pile-up a Back press of its own', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup()
    s.closePopup()
    s.openPopup() // both open in the window the step is in flight for
    s.openPopup()
    s.land()
    expect(s.live).toBe(2)

    s.back()
    expect(s.live).toBe(1)
    s.back()
    expect(s.live).toBe(0)
    expect(s.depth).toBe(0)
  })

  it('keeps a screen that opened as the popup stepped off', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup() // the settings menu
    s.closePopup()
    s.openScreen('historyPanel', true)
    s.land()
    // Decided against the entry we landed on, not the one being stepped off,
    // so the screen is on the address rather than gone with the slot.
    expect(s.screens).toEqual({ historyPanel: true })
    expect(s.depth).toBe(1)

    s.back()
    expect(s.screens).toEqual({})
    expect(s.depth).toBe(0)
  })

  it('holds the action rather than answering it, while the step is in flight', () => {
    const s = session({}, { holdSteps: true })
    s.openPopup()
    const decision = s.closePopup() // steps off the slot
    expect(decision.history).toEqual({ kind: 'go', delta: -1 })
    expect(s.openPopup().defer).toBe(true)
    expect(s.openScreen('tr', 'a').defer).toBe(true)
  })
})

describe('R5 — no Back press does nothing', () => {
  it('drops the popup Back has just uncovered', () => {
    const s = session()
    s.openPopup()
    s.back()
    expect(s.live).toBe(0)
    expect(s.depth).toBe(0)
  })

  it('closes the top popup only, leaving the one below', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    s.back()
    expect(s.live).toBe(1)
    expect(s.entry.slots).toBe(1)
  })

  it('closes the popup before the screen it sits on', () => {
    const s = session()
    s.openScreen('envEdit', true)
    s.openPopup()
    s.back()
    expect(s.live).toBe(0)
    expect(s.screens).toEqual({ envEdit: true })
    s.back()
    expect(s.screens).toEqual({})
  })

  it('leaves nothing to press through after a reload on a menu', () => {
    const s = session()
    s.openPopup()
    s.reload()
    expect(s.live).toBe(0)
    expect(s.depth).toBe(0)
    expect(s.entry.slots ?? 0).toBe(0)
  })

  it('unwinds two stacked slots in one step after a reload', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    s.reload()
    expect(s.depth).toBe(0)
    // One step, not a cascade of single ones.
    const cold = decide(
      { slots: 2, ours: true },
      { popups: 0 },
      {
        kind: 'arrive',
      }
    )
    expect(cold.history).toEqual({ kind: 'go', delta: -2 })
  })

  it('keeps a screen across a reload', () => {
    const s = session()
    s.openScreen('tr', 'a')
    s.reload()
    expect(s.screens).toEqual({ tr: 'a' })
    expect(s.depth).toBe(1)
  })

  it('returns into the screen when Back comes from another page', () => {
    const s = session()
    s.openScreen('tr', 'a')
    s.goToPage()
    expect(s.screens).toEqual({})
    s.back()
    expect(s.screens).toEqual({ tr: 'a' })
  })

  it('sends a cold arrival on a dead slot straight back', () => {
    const s = session()
    s.openPopup()
    s.closePopup()
    // Forward onto the slot we just left, with nothing alive behind it.
    const decision = decide(
      { slots: 1, ours: true },
      { popups: 0 },
      {
        kind: 'arrive',
      }
    )
    expect(decision.history).toEqual({ kind: 'go', delta: -1 })
  })
})

describe('an entry we never pushed stays that way', () => {
  it('does not claim a replaced cold entry as ours', () => {
    const cold = { screens: { tr: 'a' }, ours: false }
    const decision = decide(
      cold,
      { popups: 0 },
      {
        kind: 'openScreen',
        name: 'tr',
        value: 'b',
      }
    )
    expect(decision.history).toEqual({
      kind: 'replace',
      entry: { screens: { tr: 'b' }, slots: 0, ours: false },
    })
  })

  it('still closes by replacing rather than stepping out of the app', () => {
    const s = session({ screens: { tr: 'a' } })
    s.openScreen('tr', 'b')
    const decision = s.closeScreen('tr')
    expect(decision.history.kind).toBe('replace')
    expect(s.depth).toBe(0)
    expect(s.screens).toEqual({})
  })

  it('pushes an "instead" open when there is no screen to take over from', () => {
    const s = session()
    s.openScreen('envTx', { id: 'abc' }, true)
    expect(s.depth).toBe(1)
    s.back()
    expect(s.screens).toEqual({})
    expect(s.depth).toBe(0)
  })
})

describe('R6 — only the top screen can be closed', () => {
  it('complains and does nothing when something is open above it', () => {
    const s = session()
    s.openScreen('env', 'abc')
    s.openScreen('envEdit', true)
    const decision = s.closeScreen('env')
    expect(decision.history).toEqual({ kind: 'none' })
    expect(decision.complaint).toBeTruthy()
    expect(s.screens).toEqual({ env: 'abc', envEdit: true })
  })

  it('complains when the screen is not open at all', () => {
    const s = session()
    const decision = s.closeScreen('tr')
    expect(decision.complaint).toBeTruthy()
    expect(decision.history).toEqual({ kind: 'none' })
  })
})

describe('two opens in one tick add one entry', () => {
  it('replaces on the second when both name the same screen', () => {
    const s = session()
    s.openScreen('tr', 'a')
    s.openScreen('tr', 'b')
    expect(s.depth).toBe(1)
    expect(s.screens).toEqual({ tr: 'b' })
  })
})
