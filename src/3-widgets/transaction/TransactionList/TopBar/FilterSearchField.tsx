import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Popover } from '@base-ui/react/popover'
import { useTranslation } from 'react-i18next'
import { CloseIcon, SearchIcon } from '@/6-shared/ui/Icons'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { ListPanel } from '@/6-shared/ui/kit/ListPanel'
import { ListRow } from '@/6-shared/ui/kit/ListRow'
import { useListPanelPositioning } from '@/6-shared/ui/kit/useListPanelPositioning'
import { FilterIcon } from './FilterIcon'
import { useFilterSuggestions } from './useFilterSuggestions'
import { useSuggestionWindow } from './useSuggestionWindow'
import {
  nextFilterState,
  type FilterState,
  type FilterSuggestion,
  type SuggestionAction,
} from './filterSuggestions'

const PREVIEW_DELAY_MS = 180

export function FilterSearchField({
  query,
  search,
  mode,
  onPreviewChange,
  onSelect,
  onCancel,
}: FilterState & {
  mode: 'append' | 'replace'
  onPreviewChange?: (state: FilterState | null) => void
  onSelect: (action: SuggestionAction, focusEntry: boolean) => void
  onCancel: () => void
}) {
  const { t } = useTranslation('filterDrawer')
  const [text, setText] = useState(mode === 'replace' ? search : '')
  const [highlight, setHighlight] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const [list, setList] = useState<HTMLDivElement | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const positioning = useListPanelPositioning()
  const suggestions = useFilterSuggestions(text)
  const rows = useMemo<FilterSuggestion[]>(() => {
    if (mode === 'replace' && !text.trim())
      return [
        {
          id: 'clear',
          kind: 'search',
          label: t('clearField'),
          action: { type: 'search', text: '' },
        },
        ...suggestions,
      ]
    return suggestions
  }, [mode, text, suggestions, t])
  const index = Math.max(
    0,
    rows.findIndex(row => row.id === highlight)
  )
  const active = rows[index]
  const suggestionWindow = useSuggestionWindow(rows, index, list)
  const closed = useRef(false)
  const outsidePress = useRef(false)
  const choose = (action: SuggestionAction, focusEntry: boolean) => {
    if (closed.current) return
    closed.current = true
    onSelect(action, focusEntry)
  }
  useLayoutEffect(() => {
    input.current?.focus({ preventScroll: true })
  }, [])
  useLayoutEffect(() => {
    if (!active || !onPreviewChange) return
    const timer = setTimeout(() => {
      if (closed.current) return
      const applied = { query, search }
      const next = nextFilterState(applied, active.action, mode)
      onPreviewChange(next === applied ? null : next)
    }, PREVIEW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [active, mode, query, search, onPreviewChange])
  useLayoutEffect(() => () => onPreviewChange?.(null), [onPreviewChange])
  useEffect(() => {
    if (!anchor) return
    const outside = (event: Event) =>
      event.target instanceof Node &&
      !anchor.contains(event.target) &&
      !list?.contains(event.target)
    const down = (event: PointerEvent) => {
      outsidePress.current = outside(event)
    }
    const click = (event: MouseEvent) => {
      if (outside(event)) choose({ type: 'search', text }, false)
      outsidePress.current = false
    }
    const doc = anchor.ownerDocument
    doc.addEventListener('pointerdown', down, true)
    doc.addEventListener('click', click, true)
    return () => {
      doc.removeEventListener('pointerdown', down, true)
      doc.removeEventListener('click', click, true)
    }
  })
  const changeText = (next: string) => {
    list?.scrollTo({ top: 0 })
    setHighlight(null)
    setText(next)
  }
  const portal =
    anchor?.closest<HTMLElement>('[data-base-ui-portal]') ?? undefined
  return (
    <div
      ref={setAnchor}
      className="flex h-8 w-56 min-w-0 max-w-full items-center rounded-2xl border border-ui-border bg-ui-selected pl-2 pr-1 text-ui-16 focus-within:outline-2 focus-within:outline-ui-focus"
      onKeyDown={event => {
        if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
        event.preventDefault()
        event.stopPropagation()
        closed.current = true
        onCancel()
      }}
      onBlur={event => {
        if (
          !outsidePress.current &&
          !event.currentTarget.contains(event.relatedTarget) &&
          !list?.contains(event.relatedTarget)
        )
          choose({ type: 'search', text }, false)
      }}
    >
      <SearchIcon className="mr-1.5 size-4 shrink-0" />
      <input
        ref={input}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls={id}
        aria-activedescendant={active ? id + '-' + index : undefined}
        aria-label={t('search')}
        placeholder={t('search')}
        value={text}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-ui-primary outline-none placeholder:text-ui-placeholder"
        onChange={event => changeText(event.target.value)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            event.stopPropagation()
            const next = Math.max(
              0,
              Math.min(
                rows.length - 1,
                index + (event.key === 'ArrowDown' ? 1 : -1)
              )
            )
            setHighlight(rows[next]?.id ?? null)
            suggestionWindow.scrollToIndex(next, { align: 'auto' })
          } else if (event.key === 'Enter' && active) {
            event.preventDefault()
            event.stopPropagation()
            choose(active.action, true)
          }
        }}
      />
      {text && (
        <ButtonBase
          type="button"
          aria-label={t('clearField')}
          className="ml-1 size-6 shrink-0 rounded-full hover:bg-ui-highlight active:bg-ui-pressed"
          onMouseDown={event => event.preventDefault()}
          onClick={() => {
            changeText('')
            input.current?.focus()
          }}
        >
          <CloseIcon className="size-4" />
        </ButtonBase>
      )}
      {anchor && (
        <Popover.Root open modal={false}>
          <Popover.Portal container={portal}>
            <Popover.Positioner
              {...positioning}
              sticky={false}
              collisionAvoidance={{ side: 'flip', align: 'shift' }}
              anchor={anchor}
              className="z-popover"
            >
              <ListPanel
                className="w-72"
                scrollRender={
                  <div
                    ref={setList}
                    role="listbox"
                    id={id}
                    aria-label={t('filter')}
                  />
                }
                onMouseDown={event => event.preventDefault()}
              >
                <div
                  className="relative"
                  style={{ height: suggestionWindow.getTotalSize() }}
                >
                  {suggestionWindow.getVirtualItems().map(item => {
                    const i = item.index
                    const row = rows[i]
                    return (
                      <ListRow
                        key={row.id}
                        ref={suggestionWindow.measureElement}
                        data-index={i}
                        className="absolute inset-x-0 top-0"
                        style={{
                          transform: 'translateY(' + item.start + 'px)',
                        }}
                        aria-posinset={i + 1}
                        aria-setsize={rows.length}
                        id={id + '-' + i}
                        role="option"
                        size="sm"
                        highlighted={i === index}
                        aria-selected={i === index}
                        start={
                          row.kind === 'search' ? (
                            <SearchIcon />
                          ) : (
                            <FilterIcon kind={row.kind} />
                          )
                        }
                        end={row.kindLabel}
                        onPointerMove={event => {
                          if (
                            event.pointerType !== 'touch' &&
                            row.id !== active?.id
                          )
                            setHighlight(row.id)
                        }}
                        onClick={() => choose(row.action, true)}
                      >
                        {row.label}
                      </ListRow>
                    )
                  })}
                </div>
              </ListPanel>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  )
}
