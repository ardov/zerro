import { useCallback } from 'react'
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
} from '@tanstack/react-virtual'
import type { FilterSuggestion } from './filterSuggestions'

export function useSuggestionWindow(
  rows: readonly FilterSuggestion[],
  activeIndex: number,
  list: HTMLDivElement | null
) {
  const rangeExtractor = useCallback(
    (range: Range) => {
      const visible = defaultRangeExtractor(range)
      // Scrolling does not change the highlight. Its ARIA target must stay mounted.
      if (activeIndex < visible[0]) visible.unshift(activeIndex)
      else if (activeIndex > visible[visible.length - 1])
        visible.push(activeIndex)
      return visible
    },
    [activeIndex]
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- Reads the live virtual range on every render.
  return useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: rows.length,
    getScrollElement: () => list,
    getItemKey: useCallback((index: number) => rows[index].id, [rows]),
    estimateSize: () => 40,
    rangeExtractor,
    overscan: 4,
  })
}
