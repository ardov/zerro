import type { ReactElement, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Location } from 'react-router-dom'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import type { HistoryOp, OverlayAction, OverlayEntry } from './decide'
import { decide } from './decide'
import type { OverlayMethods, OverlayState } from './context'
import {
  AskedContext,
  OverlayMethodsContext,
  OverlayStateContext,
} from './context'

/** How long an answered surface is given before it is taken off the page.
 *
 * A ceiling rather than a duration: the exits themselves are timed in CSS
 * (`overlaySurface.css`, `Dialog.css` — the longest is 225ms), and this only
 * has to outlast them. The answer is handed over at once either way, so the
 * animation starts on the press rather than after the browser replies. */
const EXIT_CEILING_MS = 400

/** How long to wait for a history step before deciding the browser refused it.
 * A slot is always laid over something, so the step is safe; this only catches
 * the case where it silently did not happen. */
const STUCK_MS = 250

type AskLayer = {
  id: string
  element: ReactElement
  resolve: (value: unknown) => void
  /** False once answered: the promise is settled, the surface is on its way
   * out, and nothing more can come from it. */
  open: boolean
}

let askCounter = 0

/** The one place in the app that touches browser history.
 *
 * It holds the popup layers that are alive, hands them and the current history
 * entry to `decide`, and carries out the answer. Screens are not held here:
 * they are read back from the entry, which is what makes them survive a
 * reload. */
export function OverlayHost({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()

  const [live, setLive] = useState<readonly string[]>([])
  const [asks, setAsks] = useState<readonly AskLayer[]>([])

  const liveRef = useRef(live)
  const asksRef = useRef(asks)
  const locationRef = useRef(location)
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())

  // The step we have asked for and not seen land yet, held as its own mark
  // rather than a flag: a stuck step that wakes up to find a later one in
  // flight must recognise that the pending step is no longer its own.
  const stepRef = useRef<object | null>(null)

  // Actions asked for while that step was in flight. They are held rather than
  // answered, and asked again on the landing — see `decide`.
  const pendingRef = useRef<OverlayAction[]>([])

  const entry = useMemo(() => readEntry(location), [location])

  // The entry as we believe it to be, which is not always the one the router
  // has told us about yet: two opens in the same tick must not both read the
  // state the first one is replacing, or both would push. It is brought back
  // in step with the router below, so a Back press still wins.
  const entryRef = useRef(entry)

  // Declared before the reconciling effect so that one always reads a current
  // location — effects run in the order they are written.
  useEffect(() => {
    locationRef.current = location
    entryRef.current = entry
  }, [location, entry])

  /** Writes an entry at the address we are on, which is the only thing an
   * overlay ever changes about it. */
  const write = useCallback(
    (next: OverlayEntry, replace: boolean) => {
      const { pathname, search, hash } = locationRef.current
      navigate(pathname + search + hash, {
        state: withEntry(locationRef.current.state, next),
        replace,
      })
      entryRef.current = next
    },
    [navigate]
  )

  /** Asks the browser for a history step and waits for it. A step is the one
   * thing here we cannot do ourselves: it lands when the browser says so,
   * which is a good few frames later, and until then this marks the stack as
   * not to be written on. */
  const step = useCallback(
    (delta: number) => {
      const mark = {}
      stepRef.current = mark
      navigate(delta)
      const timer = setTimeout(() => {
        timersRef.current.delete(timer)
        // Ours landed, or a later step took its place: either way the stack is
        // no longer this step's to speak for.
        if (stepRef.current !== mark) return
        // The step did not happen. Clear the mark instead of leaving behind a
        // Back press that would do nothing, and let the stack be written on
        // again. The replace lands like any other arrival, which is where
        // anything held in the meantime gets asked again.
        stepRef.current = null
        write({ ...entryRef.current, slots: 0 }, true)
      }, STUCK_MS)
      timersRef.current.add(timer)
    },
    [navigate, write]
  )

  const applyOp = useCallback(
    (op: HistoryOp) => {
      if (op.kind === 'none') return
      if (op.kind === 'go') return step(op.delta)
      write(op.entry, op.kind === 'replace')
    },
    [step, write]
  )

  /** Settles one asked layer: the promise is answered now, the surface stays
   * mounted a moment longer so it can animate out. */
  const settleAsk = useCallback((id: string, value: unknown) => {
    const layer = asksRef.current.find(one => one.id === id && one.open)
    if (!layer) return
    layer.resolve(value)
    asksRef.current = asksRef.current.map(one =>
      one.id === id ? { ...one, open: false } : one
    )
    setAsks(asksRef.current)
    const timer = setTimeout(() => {
      timersRef.current.delete(timer)
      asksRef.current = asksRef.current.filter(one => one.id !== id)
      setAsks(asksRef.current)
    }, EXIT_CEILING_MS)
    timersRef.current.add(timer)
  }, [])

  /** Gives up the top `count` live layers, because history no longer has slots
   * for them — Back was pressed, or the page changed under them. */
  const dismiss = useCallback(
    (count: number) => {
      if (count <= 0) return
      const dropped = liveRef.current.slice(-count)
      liveRef.current = liveRef.current.slice(0, -count)
      setLive(liveRef.current)
      dropped.forEach(id => settleAsk(id, undefined))
    },
    [settleAsk]
  )

  /** Puts one action to `decide` — against the entry as we believe it to be,
   * and the layers alive right now — and carries out the answer. The single
   * way anything here reaches history: what a step in flight forbids, what a
   * mistaken call earns, and what each answer costs memory are all settled in
   * one place, for every action alike. */
  const perform = useCallback(
    (action: OverlayAction) => {
      const decision = decide(
        entryRef.current,
        { popups: liveRef.current.length, stepping: !!stepRef.current },
        action
      )
      if (decision.complaint) {
        if (import.meta.env.DEV)
          console.error(`[overlays] ${decision.complaint}`)
        return
      }
      if (decision.defer) {
        pendingRef.current.push(action)
        return
      }
      dismiss(decision.dismiss)
      applyOp(decision.history)
    },
    [applyOp, dismiss]
  )

  const openPopup = useCallback(
    (id: string) => {
      if (liveRef.current.includes(id)) return
      liveRef.current = [...liveRef.current, id]
      setLive(liveRef.current)
      perform({ kind: 'openPopup' })
    },
    [perform]
  )

  const closePopup = useCallback(
    (id: string) => {
      if (!liveRef.current.includes(id)) return
      liveRef.current = liveRef.current.filter(one => one !== id)
      setLive(liveRef.current)
      settleAsk(id, undefined)
      perform({ kind: 'closePopup' })
    },
    [perform, settleAsk]
  )

  const answer = useCallback(
    (id: string, value: unknown) => {
      settleAsk(id, value)
      closePopup(id)
    },
    [settleAsk, closePopup]
  )

  const ask = useCallback(
    <T,>(element: ReactElement) => {
      const id = `ask:${++askCounter}`
      return new Promise<T | undefined>(resolve => {
        asksRef.current = [
          ...asksRef.current,
          { id, element, open: true, resolve: resolve as (v: unknown) => void },
        ]
        setAsks(asksRef.current)
        openPopup(id)
      })
    },
    [openPopup]
  )

  const openScreen = useCallback(
    (name: string, value: unknown, instead?: boolean) =>
      perform({ kind: 'openScreen', name, value, instead }),
    [perform]
  )

  const closeScreen = useCallback(
    (name: string) => perform({ kind: 'closeScreen', name }),
    [perform]
  )

  // Landing on an entry — mounted, navigated, went back, reloaded — is the one
  // moment history and memory can disagree, so it is the one moment they are
  // brought back together.
  useEffect(() => {
    // The step we asked for, arriving. It is a POP, which is what tells it
    // apart from a page navigated to while it was in flight — that one leaves
    // the step pending, and the stuck timer has the last word on it.
    if (navigationType === 'POP') stepRef.current = null
    // What was held while the step was in flight is asked again here, against
    // the entry we have actually landed on. Each answer writes its own entry,
    // so popups that piled up in that window still get one Back apiece.
    while (!stepRef.current) {
      const held = pendingRef.current.shift()
      if (!held) break
      perform(held)
    }
    // Reconcile only once the stack is ours again: an answer that stepped has
    // left history mid-move, and there is nothing to compare it against yet.
    if (!stepRef.current) perform({ kind: 'arrive' })
  }, [location.key, navigationType, perform])

  // Nothing is left waiting on an answer that can no longer come.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
      asksRef.current.forEach(one => one.open && one.resolve(undefined))
    }
  }, [])

  const methods = useMemo<OverlayMethods>(
    () => ({ openPopup, closePopup, ask, openScreen, closeScreen }),
    [openPopup, closePopup, ask, openScreen, closeScreen]
  )

  const state = useMemo<OverlayState>(
    () => ({ live, screens: entry.screens ?? {} }),
    [live, entry]
  )

  return (
    <OverlayMethodsContext.Provider value={methods}>
      <OverlayStateContext.Provider value={state}>
        {children}
        {asks.map(layer => (
          <AskedLayerView key={layer.id} layer={layer} onAnswer={answer} />
        ))}
      </OverlayStateContext.Provider>
    </OverlayMethodsContext.Provider>
  )
}

function AskedLayerView({
  layer,
  onAnswer,
}: {
  layer: AskLayer
  onAnswer: (id: string, value: unknown) => void
}) {
  const value = useMemo(
    () => ({
      open: layer.open,
      answer: (answered?: unknown) => onAnswer(layer.id, answered),
    }),
    [layer.open, layer.id, onAnswer]
  )
  return (
    <AskedContext.Provider value={value}>{layer.element}</AskedContext.Provider>
  )
}

/** The overlay entry rides under its own key, so anything else a route puts in
 * `location.state` is left alone. */
function readEntry(location: Location): OverlayEntry {
  const state = location.state
  if (state && typeof state === 'object' && 'overlays' in state) {
    const entry = (state as { overlays?: unknown }).overlays
    if (entry && typeof entry === 'object') return entry as OverlayEntry
  }
  return {}
}

function withEntry(state: unknown, entry: OverlayEntry) {
  const rest = state && typeof state === 'object' ? state : {}
  return { ...rest, overlays: entry }
}
