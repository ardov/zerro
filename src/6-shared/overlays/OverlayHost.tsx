import type { ReactElement, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Location } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import type { HistoryOp, OverlayEntry } from './decide'
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

  const [live, setLive] = useState<readonly string[]>([])
  const [asks, setAsks] = useState<readonly AskLayer[]>([])

  const liveRef = useRef(live)
  const asksRef = useRef(asks)
  const locationRef = useRef(location)
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())

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

  const applyOp = useCallback(
    (op: HistoryOp) => {
      if (op.kind === 'none') return
      if (op.kind === 'go') return navigate(op.delta)
      const { pathname, search, hash } = locationRef.current
      navigate(pathname + search + hash, {
        state: withEntry(locationRef.current.state, op.entry),
        replace: op.kind === 'replace',
      })
      entryRef.current = op.entry
    },
    [navigate]
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

  const openPopup = useCallback(
    (id: string) => {
      if (liveRef.current.includes(id)) return
      liveRef.current = [...liveRef.current, id]
      setLive(liveRef.current)
      applyOp(
        decide(
          entryRef.current,
          { popups: liveRef.current.length },
          { kind: 'openPopup' }
        ).history
      )
    },
    [applyOp]
  )

  const closePopup = useCallback(
    (id: string) => {
      if (!liveRef.current.includes(id)) return
      liveRef.current = liveRef.current.filter(one => one !== id)
      setLive(liveRef.current)
      settleAsk(id, undefined)
      applyOp(
        decide(
          entryRef.current,
          { popups: liveRef.current.length },
          { kind: 'closePopup' }
        ).history
      )
    },
    [applyOp, settleAsk]
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
    (name: string, value: unknown, instead?: boolean) => {
      const decision = decide(
        entryRef.current,
        { popups: liveRef.current.length },
        { kind: 'openScreen', name, value, instead }
      )
      dismiss(decision.dismiss)
      applyOp(decision.history)
    },
    [applyOp, dismiss]
  )

  const closeScreen = useCallback(
    (name: string) => {
      const decision = decide(
        entryRef.current,
        { popups: liveRef.current.length },
        { kind: 'closeScreen', name }
      )
      if (decision.complaint) {
        if (import.meta.env.DEV)
          console.error(`[overlays] ${decision.complaint}`)
        return
      }
      dismiss(decision.dismiss)
      applyOp(decision.history)
    },
    [applyOp, dismiss]
  )

  // Landing on an entry — mounted, navigated, went back, reloaded — is the one
  // moment history and memory can disagree, so it is the one moment they are
  // brought back together.
  useEffect(() => {
    const timers = timersRef.current
    const decision = decide(
      entryRef.current,
      { popups: liveRef.current.length },
      { kind: 'arrive' }
    )
    dismiss(decision.dismiss)
    const op = decision.history
    if (op.kind !== 'go') return
    const from = locationRef.current.key
    navigate(op.delta)
    const timer = setTimeout(() => {
      timersRef.current.delete(timer)
      if (locationRef.current.key !== from) return
      // The step did not happen. Clear the mark instead of leaving behind a
      // Back press that would do nothing.
      applyOp({
        kind: 'replace',
        entry: { ...entryRef.current, slots: 0 },
      })
    }, STUCK_MS)
    timers.add(timer)
    return () => {
      timers.delete(timer)
      clearTimeout(timer)
    }
  }, [location.key, dismiss, navigate, applyOp])

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
