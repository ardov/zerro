import { useEffect } from 'react'

/**
 * Sets `document.title` directly and reliably.
 *
 * We used to drive the title through `react-helmet-async`, but under React 19
 * its async render pass would occasionally leave the title empty while
 * switching routes (the tab would fall back to showing the URL). Setting it in
 * an effect is deterministic and per-page.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}
