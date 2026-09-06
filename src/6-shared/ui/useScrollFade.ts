import { useCallback, useEffect, useState } from 'react'

/** Tells a scrolling surface which of its edges has more behind it.
 *
 * The surface hides its scrollbar — a list opened over a field is a small
 * thing and a bar down its side is most of what a person would see of it — so
 * something else has to say the list goes on. A fade at the edge does, and
 * only at the edge there is something past: a fade at the top of a list that
 * is already at its top would be a lie.
 *
 * The answer lands as `data-fade` on the element, so the fade itself is a
 * stylesheet rule and no React render happens while scrolling. */
export function useScrollFade<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)

  const update = useCallback((element: HTMLElement) => {
    // A pixel of slack: fractional scroll positions are ordinary at fractional
    // zoom, and an edge a hair from the end still counts as the end.
    const above = element.scrollTop > 1
    const below =
      element.scrollTop + element.clientHeight < element.scrollHeight - 1
    const fade = above && below ? 'both' : above ? 'top' : below ? 'bottom' : ''
    if (fade) element.dataset.fade = fade
    else delete element.dataset.fade
  }, [])

  useEffect(() => {
    if (!node) return
    const onScroll = () => update(node)
    onScroll()
    node.addEventListener('scroll', onScroll, { passive: true })
    // The list can change length without being scrolled — filtering a
    // combobox is exactly that.
    const observer = new ResizeObserver(onScroll)
    observer.observe(node)
    Array.from(node.children).forEach(child => observer.observe(child))
    return () => {
      node.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [node, update])

  return setNode
}
