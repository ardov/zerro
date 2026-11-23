import { useEffect, useMemo, useRef } from 'react'

const waitBeforeContextMenu = 500
const cooldownAfterContextMenu = 800
const moveThreshold = 10

const style: React.CSSProperties = {
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
}

/** On iOS this emulates a context menu with touch events; use the returned onClick handler too. */
export function useContextMenu(props: {
  onContextMenu?: (event: React.MouseEvent | React.TouchEvent) => void
  onClick?: (event: React.MouseEvent) => void
  threshold?: number
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const threshold = props.threshold || waitBeforeContextMenu
  const contextMenuCb = useRef(props.onContextMenu)
  const onClickCb = useRef(props.onClick)
  useEffect(() => {
    contextMenuCb.current = props.onContextMenu
    onClickCb.current = props.onClick
  })

  const propsToPass = useMemo(() => {
    const iOS = isIOS()
    const touchDevice = isTouchDevice()
    if (!iOS) {
      return {
        onContextMenu: (event: React.MouseEvent) => {
          event.preventDefault()
          contextMenuCb.current?.(event)
        },
        onClick: (event: React.MouseEvent) => onClickCb.current?.(event),
        style: touchDevice ? style : undefined,
      }
    }

    let clientX = 0
    let clientY = 0
    let lastCalledContext = 0

    const clear = () => {
      clearTimeout(timer.current)
      timer.current = undefined
    }

    const onTouchStart = (event: React.TouchEvent) => {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
      clear()
      timer.current = setTimeout(() => {
        lastCalledContext = Date.now()
        contextMenuCb.current?.(event)
      }, threshold)
    }

    const onTouchMove = (event: React.TouchEvent) => {
      const dx = event.touches[0].clientX - clientX
      const dy = event.touches[0].clientY - clientY
      if (dx * dx + dy * dy > moveThreshold * moveThreshold) clear()
    }

    const onTouchEnd = () => {
      clear()
    }

    const onContextMenu = (event: React.MouseEvent) => {
      clear()
      event.preventDefault()
      if (Date.now() - lastCalledContext < cooldownAfterContextMenu) return
      contextMenuCb.current?.(event)
    }

    const onClick = (event: React.MouseEvent) => {
      const diff = Date.now() - lastCalledContext
      if (diff < cooldownAfterContextMenu) return
      onClickCb.current?.(event)
    }

    return {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      onContextMenu,
      onClick,
      style,
    }
  }, [threshold])

  return propsToPass
}

// https://stackoverflow.com/a/9039885
function isIOS() {
  return (
    [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
