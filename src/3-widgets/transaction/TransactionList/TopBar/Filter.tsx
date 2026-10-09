import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/6-shared/overlays'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { Menu } from '@/6-shared/ui/kit/Menu'
import { AnimatedItem } from '@/6-shared/ui/kit/AnimatedItem'
import { AddIcon, FilterListIcon } from '@/6-shared/ui/Icons'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { TransactionCreateButton } from '../../TransactionCreateButton'
import { SearchChip } from './SearchChip'
import { FilterChip } from './FilterChip'
import {
  filterKinds,
  getKindLabel,
  getClauseLabel,
  isEditableKind,
  isEmptyClause,
  makeDefaultClause,
  upsertFilter,
  type Clause,
  type AddableFilterKind,
} from './filterModel'

type FilterProps = {
  query: core.transactions.TTransactionQuery
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  search: string
  onSearchChange: (search: string) => void
}

/** Owns ordering and focus; each chip owns its editor and its session draft. */
export default function Filter({
  query,
  onQueryChange,
  search,
  onSearchChange,
}: FilterProps) {
  const { t, i18n } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const tags = useAppSelector(core.tags.selectPopulated)
  const merchants = core.merchants.useAll()
  const labels = {
    accounts,
    envelopes,
    tags,
    merchants,
    t,
    language: i18n.language,
  }
  const chipRefs = useRef<Partial<Record<Clause['kind'], HTMLElement | null>>>(
    {}
  )
  const addRef = useRef<HTMLElement | null>(null)
  const focusAfterRemoval = useRef<Clause['kind'] | 'add' | null>(null)
  const [newKind, setNewKind] = useState<AddableFilterKind | null>(null)
  const menu = usePopup()
  const clauses = query.clauses
  const available = filterKinds.filter(
    kind => !clauses.some(clause => clause.kind === kind)
  )
  const hasApplied =
    clauses.some(clause => !isEmptyClause(clause)) || Boolean(search.trim())
  const hasDraft = clauses.some(isEmptyClause)

  useLayoutEffect(() => {
    const target = focusAfterRemoval.current
    if (!target) return
    focusAfterRemoval.current = null
    const element = target === 'add' ? addRef.current : chipRefs.current[target]
    ;(element?.isConnected ? element : addRef.current)?.focus()
  }, [clauses])

  const remove = (clause: Clause) => {
    const index = clauses.indexOf(clause)
    const neighbour = clauses[index + 1] ?? clauses[index - 1]
    focusAfterRemoval.current = isEmptyClause(clause)
      ? 'add'
      : (neighbour?.kind ?? 'add')
    onQueryChange({
      clauses: clauses.filter(item => item.kind !== clause.kind),
    })
  }
  const add =
    available.length > 0 && !hasDraft ? (
      <Menu
        label={t('addFilter')}
        popup={menu}
        trigger={
          hasApplied ? (
            <IconButton
              ref={node => {
                addRef.current = node
              }}
              size="xs"
              variant="ghost"
              label={t('addFilter')}
            >
              <AddIcon />
            </IconButton>
          ) : (
            <Chip
              ref={node => {
                addRef.current = node
              }}
              variant="outline-draft"
              start={<FilterListIcon />}
              onClick={() => {}}
            >
              {t('addFilter')}
            </Chip>
          )
        }
        items={available.map(kind => ({
          id: kind,
          label: getKindLabel(kind, t),
          onSelect: () => {
            setNewKind(kind)
            onQueryChange(upsertFilter(query, makeDefaultClause(kind)))
          },
        }))}
      />
    ) : null
  return (
    <div className="flex items-start gap-2 rounded-ui-card rounded-smooth bg-ui-card p-2 text-ui-primary shadow-ui-card">
      <LayoutGroup>
        <div
          className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
          aria-label={t('filter')}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <AnimatedItem key="search">
              <SearchChip
                ref={node => {
                  chipRefs.current.search = node
                }}
                value={search}
                onChange={onSearchChange}
              />
              {!clauses.length && add}
            </AnimatedItem>
            {clauses.map((clause, index) => (
              <AnimatedItem key={clause.kind}>
                <FilterChip
                  ref={node => {
                    chipRefs.current[clause.kind] = node
                  }}
                  clause={clause}
                  label={getClauseLabel(clause, labels)}
                  autoOpen={
                    newKind === clause.kind && isEditableKind(clause.kind)
                  }
                  onChange={next => onQueryChange(upsertFilter(query, next))}
                  onRemove={() => remove(clause)}
                />
                {index === clauses.length - 1 && add}
              </AnimatedItem>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      <div className="shrink-0">
        <TransactionCreateButton query={query} />
      </div>
    </div>
  )
}
