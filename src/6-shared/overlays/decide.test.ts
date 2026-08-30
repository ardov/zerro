import { describe, expect, it } from 'vitest'
import type { OverlayAction, OverlayEntry } from './decide'
import { decide } from './decide'

/** A history stack plus the app's live popup layers, driven exactly the way
 * `OverlayHost` drives them. Scenarios below read as a person's session:
 * open, press Back, reload. */
function session(initial: OverlayEntry = {}) {
  const entries: OverlayEntry[] = [initial]
  let idx = 0
  let live = 0

  function entry() {
    return entries[idx]
  }

  function ask(action: OverlayAction) {
    const decision = decide(entry(), { popups: live }, action)
    live -= decision.dismiss
    const op = decision.history
    if (op.kind === 'push') {
      entries.splice(idx + 1)
      entries.push(op.entry)
      idx++
    }
    if (op.kind === 'replace') entries[idx] = op.entry
    if (op.kind === 'go') idx += op.delta
    if (op.kind === 'go') settle()
    return decision
  }

  /** What the host's effect does on every landing: reconcile until still. */
  function settle() {
    for (let guard = 0; guard < 10; guard++) {
      const decision = decide(entry(), { popups: live }, { kind: 'arrive' })
      live -= decision.dismiss
      if (decision.history.kind !== 'go') return
      idx += decision.history.delta
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
      if (live === 0) return { history: { kind: 'none' }, dismiss: 0 } as const
      live--
      return ask({ kind: 'closePopup' })
    },
    /** The browser's Back button. */
    back() {
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
    expect(s.entry.popups).toBe(1)
    expect(s.screens).toEqual({ env: 'abc' })
  })

  it('stacks a popup on a popup, one entry each', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    expect(s.depth).toBe(2)
    expect(s.entry.popups).toBe(2)
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
    expect(s.entry.popups).toBe(0)
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
    expect(s.entry.popups).toBe(1)
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
    expect(s.entry.popups ?? 0).toBe(0)
  })

  it('unwinds two stacked slots in one step after a reload', () => {
    const s = session()
    s.openPopup()
    s.openPopup()
    s.reload()
    expect(s.depth).toBe(0)
    // One step, not a cascade of single ones.
    const cold = decide({ popups: 2, ours: true }, { popups: 0 }, {
      kind: 'arrive',
    })
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
    const decision = decide({ popups: 1, ours: true }, { popups: 0 }, {
      kind: 'arrive',
    })
    expect(decision.history).toEqual({ kind: 'go', delta: -1 })
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
