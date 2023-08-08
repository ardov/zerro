import { useMemo, useRef } from 'react'

const waitBeforeContextMenu = 500
const cooldownAfterContextMenu = 800
const moveTreshold = 10

// Styles to prevent selection on touch devices
const style: React.CSSProperties = {
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
}

/**
 * Hook to handle contextmenu event on all devices including iOS.
 * - Note that onClick event shoul also be handled by this hook.
 * - Note that onContextMenu receives both mouseEvent and touchEvent.
 */
export function useContextMenu(props: {
  onContextMenu?: (event: React.MouseEvent | React.TouchEvent) => void
  onClick?: (event: React.MouseEvent) => void
  treshold?: number
}) {
  const treshold = props.treshold || waitBeforeContextMenu
  const contextMenuCb = useRef(props.onContextMenu)
  const onClickCb = useRef(props.onClick)

  const propsToPass = useMemo(() => {
    const iOS = isIOS()
    const touchDevice = isTouchDevice()
    if (!iOS) {
      return {
        onContextMenu: (event: React.MouseEvent) => {
          event.preventDefault()
          contextMenuCb.current?.(event)
        },
        onClick: onClickCb.current,
        style: touchDevice ? style : undefined,
      }
    }

    let timer: NodeJS.Timeout | undefined
    let clientX = 0
    let clientY = 0
    let lastCalledContext = 0

    const clear = () => {
      clearTimeout(timer)
      timer = undefined
    }

    // Handle touch start
    const onTouchStart = (event: React.TouchEvent) => {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
      clear()
      timer = setTimeout(() => {
        lastCalledContext = Date.now()
        contextMenuCb.current?.(event)
      }, treshold)
    }

    // Handle touch move
    const onTouchMove = (event: React.TouchEvent) => {
      const dx = event.touches[0].clientX - clientX
      const dy = event.touches[0].clientY - clientY
      if (dx * dx + dy * dy > moveTreshold * moveTreshold) clear()
    }

    // Handle touch end
    const onTouchEnd = () => {
      clear()
    }

    // Handle context menu on android or right click
    const onContextMenu = (event: React.MouseEvent) => {
      clear()
      event.preventDefault()
      if (Date.now() - lastCalledContext < cooldownAfterContextMenu) return
      contextMenuCb.current?.(event)
    }

    // Handle click
    const onClick = (event: React.MouseEvent) => {
      const diff = Date.now() - lastCalledContext
      if (diff < cooldownAfterContextMenu) return
      onClickCb.current?.(event)
    }

    return {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onContextMenu,
      onClick,
      style,
    }
  }, [treshold])

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
