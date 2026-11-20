import { useEffect, type RefObject } from 'react'

const PRESS_TILT = 0.7
const HOVER_TILT = 0.25
const MIN_PRESS_MS = 120

/** Pointer coordinates inside the frame are already in the plate's local
 * space, unaffected by its perspective. Observe without intercepting input. */
export function useDemoTilt(
  frame: RefObject<HTMLIFrameElement | null>,
  surface: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const iframe = frame.current
    const plate = surface.current
    if (!iframe || !plate) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)')
    let child: Window | null = null
    let pointer: number | null = null
    let hover: { x: number; y: number } | null = null
    let pressing = false
    let pressedAt = 0
    let releaseTimer: ReturnType<typeof setTimeout> | undefined
    let hoverFrame: number | undefined

    const position = (event: PointerEvent) => {
      const normalize = (value: number, size: number) =>
        Math.max(-1, Math.min(1, (value / size) * 2 - 1))
      return {
        x: normalize(event.clientX, iframe.clientWidth),
        y: normalize(event.clientY, iframe.clientHeight),
      }
    }
    const tilt = (point: { x: number; y: number }, strength: number) => {
      plate.style.setProperty('--demo-tilt-x', `${point.y * strength}deg`)
      plate.style.setProperty('--demo-tilt-y', `${-point.x * strength}deg`)
    }
    const settle = () => {
      pressing = false
      delete plate.dataset.pressed
      if (hover) tilt(hover, HOVER_TILT)
      else {
        plate.style.removeProperty('--demo-tilt-x')
        plate.style.removeProperty('--demo-tilt-y')
      }
    }
    const reset = () => {
      clearTimeout(releaseTimer)
      if (hoverFrame !== undefined) cancelAnimationFrame(hoverFrame)
      hoverFrame = undefined
      pointer = null
      hover = null
      settle()
    }
    const canHover = (event: PointerEvent) =>
      !reducedMotion.matches &&
      hoverPointer.matches &&
      event.pointerType === 'mouse'
    const move = (event: PointerEvent) => {
      if (!canHover(event)) return
      hover = position(event)
      if (pressing || event.buttons || hoverFrame !== undefined) return
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = undefined
        if (!pressing) settle()
      })
    }
    const leave = (event: PointerEvent) => {
      if (event.relatedTarget !== null) return
      hover = null
      if (!pressing) settle()
    }
    const press = (event: PointerEvent) => {
      if (reducedMotion.matches || !event.isPrimary || event.button !== 0)
        return
      clearTimeout(releaseTimer)
      pointer = event.pointerId
      pressedAt = performance.now()
      pressing = true
      const point = position(event)
      hover = canHover(event) ? point : null
      plate.dataset.pressed = ''
      tilt(point, -PRESS_TILT)
    }
    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return
      pointer = null
      if (event.currentTarget !== child) hover = null
      // A quick click still gets a small, visible response before settling.
      releaseTimer = setTimeout(
        settle,
        Math.max(0, MIN_PRESS_MS - (performance.now() - pressedAt))
      )
    }
    const leavePage = () => {
      // Focusing the embedded document also blurs the parent window.
      queueMicrotask(() => {
        if (!document.hasFocus()) reset()
      })
    }
    const disconnect = () => {
      child?.removeEventListener('pointerdown', press, true)
      child?.removeEventListener('pointermove', move, true)
      child?.removeEventListener('pointerout', leave, true)
      child?.removeEventListener('pointerup', release, true)
      child?.removeEventListener('pointercancel', reset, true)
      child?.removeEventListener('blur', reset)
    }
    const connect = () => {
      disconnect()
      reset()
      child = iframe.contentWindow
      child?.addEventListener('pointermove', move, {
        capture: true,
        passive: true,
      })
      child?.addEventListener('pointerout', leave, {
        capture: true,
        passive: true,
      })
      child?.addEventListener('pointerdown', press, {
        capture: true,
        passive: true,
      })
      child?.addEventListener('pointerup', release, {
        capture: true,
        passive: true,
      })
      child?.addEventListener('pointercancel', reset, {
        capture: true,
        passive: true,
      })
      child?.addEventListener('blur', reset)
    }

    connect()
    iframe.addEventListener('load', connect)
    window.addEventListener('pointerup', release, {
      capture: true,
      passive: true,
    })
    window.addEventListener('pointercancel', reset, {
      capture: true,
      passive: true,
    })
    window.addEventListener('blur', leavePage)
    reducedMotion.addEventListener('change', reset)
    hoverPointer.addEventListener('change', reset)
    return () => {
      reset()
      disconnect()
      iframe.removeEventListener('load', connect)
      window.removeEventListener('pointerup', release, true)
      window.removeEventListener('pointercancel', reset, true)
      window.removeEventListener('blur', leavePage)
      reducedMotion.removeEventListener('change', reset)
      hoverPointer.removeEventListener('change', reset)
    }
  }, [frame, surface])
}
