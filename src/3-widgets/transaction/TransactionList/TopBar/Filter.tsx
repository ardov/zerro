import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { useOwnedPopup } from '@/6-shared/ui/kit/useOwnedPopup'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { AnimatedItem } from '@/6-shared/ui/kit/AnimatedItem'
import { AddIcon, SearchIcon } from '@/6-shared/ui/Icons'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { TransactionCreateButton } from '../../TransactionCreateButton'
import { FilterSearchField } from './FilterSearchField'
import { FilterChip } from './FilterChip'
import { SummaryButton, type SummaryToggle } from './SummaryButton'
import {
  nextFilterState,
  type FilterState,
  type SuggestionAction,
} from './filterSuggestions'
import {
  getClauseLabel,
  isEditableKind,
  isEmptyClause,
  makeDefaultClause,
  upsertFilter,
  type Clause,
  type EditableFilterKind,
} from './filterModel'

type FilterProps = FilterState & {
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  onSearchChange: (search: string) => void
  onPreviewChange?: (preview: FilterState | null) => void
  quickFilters?: { clause: Clause; count: number }[]
  summary?: SummaryToggle
  bare?: boolean
}

export default function Filter({
  query,
  onQueryChange,
  search,
  onSearchChange,
  onPreviewChange,
  quickFilters = [],
  summary,
  bare = false,
}: FilterProps) {
  const { t, i18n } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const tags = core.tags.usePopulated()
  const debtors = useAppSelector(core.debtors.selectOptions)
  const merchants = core.merchants.useAll()
  const today = useLocalDay()
  const labels = {
    today,
    accounts,
    envelopes,
    tags,
    merchants,
    debtors,
    t,
    language: i18n.language,
  }
  const chipRefs = useRef<Partial<Record<Clause['kind'], HTMLElement | null>>>(
    {}
  )
  const entryRef = useRef<HTMLElement | null>(null)
  const nextFocus = useRef<Clause['kind'] | 'entry' | null>(null)
  const [editor, setEditor] = useState<EditableFilterKind | null>(null)
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  const closingFromField = useRef(false)
  const field = useOwnedPopup({
    onClose: () => {
      // A native Back returns focus to the original trigger. Outside clicks
      // and transitions into an editor keep their own focus destination.
      if (!closingFromField.current)
        nextFocus.current = mode === 'replace' ? 'search' : 'entry'
    },
  })
  const closeField = () => {
    closingFromField.current = true
    field.setOpen(false)
  }
  const { clauses } = query
  const hasApplied =
    clauses.some(clause => !isEmptyClause(clause)) || Boolean(search.trim())
  const pending =
    editor && !clauses.some(clause => clause.kind === editor)
      ? makeDefaultClause(editor)
      : null
  const visible = pending ? [...clauses, pending] : clauses

  useLayoutEffect(() => {
    const target = nextFocus.current
    if (!target || (target === 'entry' && pending)) return
    nextFocus.current = null
    const element =
      target === 'entry' ? entryRef.current : chipRefs.current[target]
    ;(element?.isConnected ? element : entryRef.current)?.focus()
  })
  const open = (next: 'append' | 'replace') => {
    closingFromField.current = false
    setMode(next)
    field.setOpen(true)
  }
  const select = (action: SuggestionAction, focusEntry: boolean) => {
    closeField()
    if (action.type === 'edit') {
      setEditor(action.kind)
      return
    }
    if (focusEntry) nextFocus.current = 'entry'
    const next = nextFilterState({ query, search }, action, mode)
    if (query !== next.query) onQueryChange(next.query)
    if (search !== next.search) onSearchChange(next.search)
  }
  const remove = (clause: Clause) => {
    const index = clauses.indexOf(clause)
    const neighbour = clauses[index + 1] ?? clauses[index - 1]
    nextFocus.current = neighbour?.kind ?? 'entry'
    if (editor === clause.kind) setEditor(null)
    onQueryChange({
      clauses: clauses.filter(item => item.kind !== clause.kind),
    })
  }
  const entry = (
    <IconButton
      ref={node => {
        if (node && !pending) entryRef.current = node
      }}
      size="xs"
      variant="ghost"
      label={t(hasApplied ? 'addFilter' : 'search')}
      tooltip={!pending}
      onClick={pending ? undefined : () => open('append')}
    >
      {hasApplied ? <AddIcon /> : <SearchIcon />}
    </IconButton>
  )
  const searchField = (
    <FilterSearchField
      query={query}
      search={search}
      mode={mode}
      onPreviewChange={onPreviewChange}
      onSelect={select}
      onCancel={() => {
        nextFocus.current = mode === 'replace' ? 'search' : 'entry'
        closeField()
      }}
    />
  )
  const editingSearch = Boolean(search) && mode === 'replace' && field.open
  const closedEntry = field.open || pending ? null : entry
  const showQuickFilters = Boolean(closedEntry) && !hasApplied
  const pairedQuickFilters = showQuickFilters && quickFilters.length > 1
  return (
    <div className="flex items-start gap-2 p-2 text-ui-primary">
      <LayoutGroup>
        <div
          className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1.5 @container/filters"
          aria-label={t('filter')}
        >
          {search && (
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              {editingSearch ? (
                searchField
              ) : (
                <Chip
                  className="min-w-0 shrink"
                  ref={node => {
                    chipRefs.current.search = node
                  }}
                  start={<SearchIcon />}
                  removeOnHover
                  onClick={() => open('replace')}
                  onRemove={() => {
                    nextFocus.current = clauses[0]?.kind ?? 'entry'
                    onSearchChange('')
                  }}
                >
                  {search}
                </Chip>
              )}
              {!visible.length && closedEntry}
            </div>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((clause, index) => (
              <AnimatedItem key={clause.kind}>
                <FilterChip
                  ref={node => {
                    chipRefs.current[clause.kind] = node
                  }}
                  clause={clause}
                  label={getClauseLabel(clause, labels)}
                  autoOpen={editor === clause.kind}
                  draftTrigger={pending === clause ? entry : undefined}
                  onEditorClose={() => {
                    if (editor === clause.kind) {
                      if (pending) nextFocus.current = 'entry'
                      setEditor(null)
                    }
                    if (clauses.includes(clause) && isEmptyClause(clause))
                      remove(clause)
                  }}
                  onChange={next => {
                    if (isEmptyClause(next) && isEditableKind(next.kind)) {
                      setEditor(next.kind)
                      onQueryChange({
                        clauses: clauses.filter(
                          item => item.kind !== next.kind
                        ),
                      })
                    } else onQueryChange(upsertFilter(query, next))
                  }}
                  onRemove={() => remove(clause)}
                />
                {index === visible.length - 1 && closedEntry}
              </AnimatedItem>
            ))}
          </AnimatePresence>
          {!visible.length && !search && closedEntry}
          {showQuickFilters &&
            quickFilters.map(({ clause, count }) => (
              <Chip
                key={clause.kind}
                variant="outline-draft"
                onClick={() => {
                  nextFocus.current = clause.kind
                  onQueryChange(upsertFilter(query, clause))
                }}
              >
                {getClauseLabel(clause, labels)}{' '}
                <span
                  className={
                    pairedQuickFilters
                      ? 'text-ui-tertiary @max-[316px]/filters:sr-only'
                      : 'text-ui-tertiary'
                  }
                >
                  {count.toLocaleString(i18n.language)}
                </span>
              </Chip>
            ))}
          {field.open && !editingSearch && searchField}
        </div>
      </LayoutGroup>
      {!bare && (
        <div className="flex shrink-0">
          {summary && <SummaryButton {...summary} />}
          <TransactionCreateButton query={query} />
        </div>
      )}
    </div>
  )
}
