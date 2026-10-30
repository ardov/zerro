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

/** How long an answered surface is given before it is taken off the page.
 *
 * A ceiling rather than a duration: the exits themselves are timed in CSS
 * (kit `Drawer.css` and `Surface.css` — the longest is 250ms), and this only
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
 * entry to `decide`, and carries out the answer. Screen membership and order
 * come from that entry. The latest values of repeatable instances are cached
 * across Back and written into the entry so they also survive a reload. */
export function OverlayHost({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()

  const [live, setLive] = useState<readonly string[]>([])
  const [asks, setAsks] = useState<readonly AskLayer[]>([])
  // Screens asked to close whose entry has not gone yet. Closing one steps
  // back through history, which lands a good few frames later; until then
  // the screen already reads as closed, so a surface that animates out on its
  // own — a swiped drawer — is not told to come back meanwhile.
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

  // The step we have asked for and not seen land yet, held as its own mark
  // rather than a flag: a stuck step that wakes up to find a later one in
  // flight must recognise that the pending step is no longer its own.
  const stepRef = useRef<object | null>(null)
  const closingThroughRef = useRef<string | undefined>(undefined)
  const backDispatchRef = useRef(false)

  // Actions asked for while that step was in flight. They are held rather than
  // answered, and asked again on the landing — see `decide`.
  const pendingRef = useRef<OverlayAction[]>([])

  // Values are cached by instance id, but order always comes from history.
  // A wide pair can change its list while Details are open; Back must not
  // restore the older copy of that list's view state from an earlier entry.
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

  // The entry as we believe it to be, which is not always the one the router
  // has told us about yet: two opens in the same tick must not both read the
  // state the first one is replacing, or both would push. It is brought back
  // in step with the router below, so a Back press still wins.
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

  /** Writes an entry at the address we are on, which is the only thing an
   * overlay ever changes about it. */
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
      dropped.toReversed().forEach(id => {
        notifyClose(id)
        settleAsk(id, undefined)
      })
    },
    [settleAsk, notifyClose]
  )

  /** Puts one action to `decide` — against the entry as we believe it to be,
   * and the layers alive right now — and carries out the answer. The single
   * way anything here reaches history: what a step in flight forbids, what a
   * mistaken call earns, and what each answer costs memory are all settled in
   * one place, for every action alike. */
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
    // One native close signal can notify multiple watchers in the same task.
    // Deduplicate that dispatch, not the entire asynchronous history step:
    // a later gesture must still close the next owner via the existing queue.
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
    // The step we asked for, arriving. It is a POP, which is what tells it
    // apart from a page navigated to while it was in flight — that one leaves
    // the step pending, and the stuck timer has the last word on it.
    if (arrived && navigationType === 'POP') stepRef.current = null
    // Back may cancel a popup push before that location commits. Its key then
    // stays the same, but live layers still need reconciling with history.
    // Persist a restored live value into this entry so a reload sees it too.
    if (!stepRef.current && entry !== recordedEntry)
      write(entryRef.current, true)
    // Finish an explicit group close before replaying new opens. Otherwise a
    // child opened on an intermediate entry would be closed with that group.
    if (!stepRef.current && closingThroughRef.current)
      perform({ kind: 'arrive' })
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
    // Settled: nothing in flight, nothing held. From here the entry alone says
    // what is open — including a close the browser refused, which shows the
    // screen again rather than leaving it hidden over a live entry.
    if (!stepRef.current && !pendingRef.current.length)
      setClosing(names => (names.size ? new Set() : names))
  }, [location.key, navigationType, perform, entry, recordedEntry, write])

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

/** An asked surface is mounted only once it is already open, so Base UI has
 * nothing closed to transition from: its transition status starts at whatever
 * the first committed frame said, and a popup that was open on that frame gets
 * no starting style. Withhold the open by one frame to give it that frame.
 *
 * Closing is not delayed — an answer has to start its exit on the press.
 *
 * Here rather than in each surface: every asked overlay mounts this way, so a
 * fix at the call site is one every next surface has to remember, and it would
 * have to know which breakpoint it is animating for. */
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
