import type { ReactElement, ReactNode } from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Location } from 'react-router-dom'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import type { HistoryOp, OverlayAction, OverlayEntry } from './decide'
import { decide } from './decide'
import { remember, restore, type ScreenMemory } from './screenMemory'
import type { OverlayMethods, OverlayState } from './context'
import {
  AskedContext,
  OverlayMethodsContext,
  OverlayStateContext,
} from './context'

/** The unmount timeout must outlast Drawer.css and Surface.css exits; settle the answer immediately. */
const EXIT_CEILING_MS = 400

/** Recover if the browser silently refuses a requested history step. */
const STUCK_MS = 250

type AskLayer = {
  id: string
  element: ReactElement
  resolve: (value: unknown) => void
  open: boolean
}

let askCounter = 0

/** The host executes decide. History owns membership and order; cached view revisions survive Back and reload. */
export function OverlayHost({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()

  const [live, setLive] = useState<readonly string[]>([])
  const [asks, setAsks] = useState<readonly AskLayer[]>([])
  // Read a pending close as closed so the browser's delayed Back cannot reopen a swiped drawer.
  const [closing, setClosing] = useState<ReadonlySet<string>>(new Set())

  const liveRef = useRef(live)
  const asksRef = useRef(asks)
  const locationRef = useRef(location)
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())
  const closeListeners = useRef(new Map<string, Set<() => void>>())
  const subscribeClose = useCallback((id: string, listener: () => void) => {
    const listeners = closeListeners.current.get(id) ?? new Set<() => void>()
    listeners.add(listener)
    closeListeners.current.set(id, listeners)
    return () => {
      listeners.delete(listener)
      if (!listeners.size) closeListeners.current.delete(id)
    }
  }, [])
  const notifyClose = useCallback((id: string) => {
    const listeners = closeListeners.current.get(id)
    Array.from(listeners ?? []).forEach(listener => {
      try {
        listener()
      } catch (error) {
        globalThis.reportError(error)
      }
    })
  }, [])

  const notifiedScreens = useRef(new Set<string>())
  const notifyScreenClose = useCallback(
    (id: string) => {
      if (notifiedScreens.current.has(id)) return
      notifiedScreens.current.add(id)
      notifyClose(id)
    },
    [notifyClose]
  )

  // Use a step token so a stale timeout cannot cancel a later history request.
  const stepRef = useRef<object | null>(null)
  const closingThroughRef = useRef<string | undefined>(undefined)
  const backDispatchRef = useRef(false)

  const pendingRef = useRef<OverlayAction[]>([])

  // Cache values by instance ID while keeping history order. Back must retain newer edits to the list under Details.
  const [memory, setMemory] = useState<ScreenMemory>(() =>
    remember({}, readEntry(location))
  )
  const memoryRef = useRef(memory)
  const updateMemory = useCallback(
    (update: (previous: ScreenMemory) => ScreenMemory) => {
      memoryRef.current = update(memoryRef.current)
      setMemory(memoryRef.current)
    },
    []
  )
  const recordedEntryRef = useRef<OverlayEntry>({})
  const recordedEntry = useMemo(() => readEntry(location), [location])
  const entry = useMemo(
    () => restore(recordedEntry, memory),
    [recordedEntry, memory]
  )

  // Read optimistic writes so two opens in one tick cannot both push from the same old entry.
  const entryRef = useRef(entry)

  const previousScreenIds = useRef(new Set(Object.keys(entry.screens ?? {})))

  // Declared before the reconciling effect so that one always reads a current
  // location — effects run in the order they are written.
  useLayoutEffect(() => {
    const arrived = locationRef.current !== location
    locationRef.current = location
    // A cache update can render before the router's transition lands. Keep
    // the optimistic entry until its location arrives, including new children.
    if (arrived) {
      entryRef.current = entry
      updateMemory(previous => remember(previous, recordedEntry))
    }
    recordedEntryRef.current = recordedEntry
    const ids = new Set(Object.keys(entry.screens ?? {}))
    previousScreenIds.current.forEach(id => {
      if (!ids.has(id)) notifyScreenClose(id)
    })
    ids.forEach(id => {
      if (!previousScreenIds.current.has(id)) notifiedScreens.current.delete(id)
    })
    previousScreenIds.current = ids
  }, [location, entry, recordedEntry, notifyScreenClose, updateMemory])

  const write = useCallback(
    (next: OverlayEntry, replace: boolean) => {
      updateMemory(previous => remember(previous, next))
      const { pathname, search, hash } = locationRef.current
      navigate(pathname + search + hash, {
        state: withEntry(locationRef.current.state, next),
        replace,
      })
      entryRef.current = next
    },
    [navigate, updateMemory]
  )

  const step = useCallback(
    (delta: number) => {
      const mark = {}
      stepRef.current = mark
      navigate(delta)
      const timer = setTimeout(() => {
        timersRef.current.delete(timer)
        if (stepRef.current !== mark) return
        // Unblock writes if the step never lands. Replacing the entry replays deferred actions on arrival.
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

  const dismiss = useCallback(
    (count: number) => {
      if (count <= 0) return
      const dropped = liveRef.current.slice(-count)
      liveRef.current = liveRef.current.slice(0, -count)
      setLive(liveRef.current)
      dropped.toReversed().forEach(id => {
        notifyClose(id)
        settleAsk(id, undefined)
      })
    },
    [settleAsk, notifyClose]
  )

  const perform = useCallback(
    (action: OverlayAction): boolean => {
      const decision = decide(
        entryRef.current,
        {
          popups: liveRef.current.length,
          stepping: !!stepRef.current,
          closingThrough: closingThroughRef.current,
          removedTop:
            memoryRef.current[
              Object.keys(recordedEntryRef.current.screens ?? {}).at(-1) ?? ''
            ]?.removed,
        },
        action
      )
      if (decision.complaint) {
        if (import.meta.env.DEV)
          console.error(`[overlays] ${decision.complaint}`)
        return false
      }
      if (decision.defer) {
        pendingRef.current.push(action)
        return true
      }
      if (action.kind === 'closeScreen' && action.through)
        closingThroughRef.current = action.name
      dismiss(decision.dismiss)
      applyOp(decision.history)
      const through = closingThroughRef.current
      if (through && !(through in (entryRef.current.screens ?? {})))
        closingThroughRef.current = undefined
      return true
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
    (id: string, notify = true) => {
      if (!liveRef.current.includes(id)) return
      liveRef.current = liveRef.current.filter(one => one !== id)
      setLive(liveRef.current)
      if (notify) notifyClose(id)
      settleAsk(id, undefined)
      perform({ kind: 'closePopup' })
    },
    [perform, settleAsk, notifyClose]
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
      setClosing(names => without(names, name))
      notifiedScreens.current.delete(name)
      // Every explicit opening starts a fresh value, including singleton
      // reuse. New instance ids are already unique; no id protocol is needed.
      updateMemory(previous => {
        if (!(name in previous)) return previous
        const next = { ...previous }
        delete next[name]
        return next
      })
      perform({ kind: 'openScreen', name, value, instead })
    },
    [perform, updateMemory]
  )

  const removeScreen = useCallback(
    (name: string) => {
      if (memoryRef.current[name]?.removed) return
      perform({ kind: 'removeScreen', name })
      updateMemory(previous => ({ ...previous, [name]: { removed: true } }))
      notifyScreenClose(name)
    },
    [perform, notifyScreenClose, updateMemory]
  )

  const updateScreen = useCallback(
    (name: string, update: (value: unknown) => unknown) => {
      perform({ kind: 'updateScreen', name, update })
    },
    [perform]
  )

  const closeScreen = useCallback(
    (name: string, options?: { through?: boolean }) => {
      const names = Object.keys(entryRef.current.screens ?? {})
      const index = names.indexOf(name)
      const closingIds =
        options?.through && index >= 0 ? names.slice(index) : [name]
      if (perform({ kind: 'closeScreen', name, through: options?.through })) {
        closingIds.toReversed().forEach(notifyScreenClose)
        setClosing(previous => new Set([...previous, ...closingIds]))
      }
    },
    [perform, notifyScreenClose]
  )

  // A native close request can be delivered to a drawer underneath a select
  // or an asked popup. The host owns the actual order of all these layers.
  const back = useCallback(() => {
    // Deduplicate watchers within one native close dispatch; a later gesture must still close the next layer.
    if (backDispatchRef.current) return true
    const popup = liveRef.current.at(-1)
    const screen = Object.keys(entryRef.current.screens ?? {})
      .filter(name => !closing.has(name))
      .at(-1)
    if (popup === undefined && screen === undefined) return false
    backDispatchRef.current = true
    const timer = setTimeout(() => {
      timersRef.current.delete(timer)
      backDispatchRef.current = false
    }, 0)
    timersRef.current.add(timer)
    if (popup !== undefined) {
      closePopup(popup)
      return true
    }
    if (screen !== undefined) {
      closeScreen(screen)
      return true
    }
    return false
  }, [closePopup, closeScreen, closing])

  // A changed location can settle a history step. Local memory changes can
  // also need reconciliation, but must not settle a step still in flight.
  const lastArrival = useRef<string | undefined>(undefined)
  useEffect(() => {
    const arrived = lastArrival.current !== location.key
    lastArrival.current = location.key
    // Only a POP can settle this pending history step; other navigation leaves it for the timeout.
    if (arrived && navigationType === 'POP') stepRef.current = null
    // A Back that cancels a pending popup push can leave the same key; reconcile live layers anyway.
    if (!stepRef.current && entry !== recordedEntry)
      write(entryRef.current, true)
    // Finish an explicit group close before replaying new opens. Otherwise a
    // child opened on an intermediate entry would be closed with that group.
    if (!stepRef.current && closingThroughRef.current)
      perform({ kind: 'arrive' })
    // Replay deferred actions against the landed entry so each popup gets its own Back step.
    while (!stepRef.current) {
      const held = pendingRef.current.shift()
      if (!held) break
      perform(held)
    }
    if (!stepRef.current) perform({ kind: 'arrive' })
    // Once settled, the entry owns visibility; a refused close shows the screen again.
    if (!stepRef.current && !pendingRef.current.length)
      setClosing(names => (names.size ? new Set() : names))
  }, [location.key, navigationType, perform, entry, recordedEntry, write])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
      asksRef.current.forEach(one => one.open && one.resolve(undefined))
    }
  }, [])

  const methods = useMemo<OverlayMethods>(
    () => ({
      back,
      openPopup,
      closePopup,
      ask,
      openScreen,
      closeScreen,
      updateScreen,
      removeScreen,
      subscribeClose,
    }),
    [
      back,
      openPopup,
      closePopup,
      ask,
      openScreen,
      closeScreen,
      updateScreen,
      removeScreen,
      subscribeClose,
    ]
  )

  const state = useMemo<OverlayState>(() => {
    const screens = { ...entry.screens }
    closing.forEach(name => delete screens[name])
    return { live, screens }
  }, [live, entry, closing])

  return (
    <OverlayMethodsContext.Provider value={methods}>
      <OverlayStateContext.Provider value={state}>
        {children}
        {asks.map(layer => (
          <AskedLayerView
            key={layer.id}
            layer={layer}
            onAnswer={answer}
            onClose={closePopup}
            subscribeClose={subscribeClose}
          />
        ))}
      </OverlayStateContext.Provider>
    </OverlayMethodsContext.Provider>
  )
}

function AskedLayerView({
  layer,
  onAnswer,
  onClose,
  subscribeClose,
}: {
  layer: AskLayer
  onAnswer: (id: string, value: unknown) => void
  onClose: (id: string) => void
  subscribeClose: OverlayMethods['subscribeClose']
}) {
  const open = useEntranceOpen(layer.open)
  const answer = useCallback(
    (answered?: unknown) => onAnswer(layer.id, answered),
    [layer.id, onAnswer]
  )
  const methods = useMemo(
    () => ({
      setOpen: (next: boolean) => {
        if (!next) onClose(layer.id)
      },
      subscribeClose: (listener: () => void) =>
        subscribeClose(layer.id, listener),
    }),
    [onClose, layer.id, subscribeClose]
  )
  const value = useMemo(
    () => ({ open, answer, controller: { open, ...methods } }),
    [open, answer, methods]
  )
  return (
    <AskedContext.Provider value={value}>{layer.element}</AskedContext.Provider>
  )
}

/** Base UI needs an initial closed frame to animate an already-open mount. Start the exit immediately. */
function useEntranceOpen(open: boolean) {
  const [entered, setEntered] = useState(false)
  // Reset while rendering the closed layer, so the next opening of a layer
  // that is kept mounted through its exit gets its closed frame too.
  if (!open && entered) setEntered(false)
  useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])
  return open && entered
}

function without(names: ReadonlySet<string>, name: string) {
  if (!names.has(name)) return names
  const next = new Set(names)
  next.delete(name)
  return next
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
