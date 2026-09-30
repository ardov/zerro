import { Chip } from '@/6-shared/ui/kit/Chip'
import { CategoryMultiSelect } from '../../../category/CategoryMultiSelect'
import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { usePopup } from '@/6-shared/overlays'
import { useTranslation } from 'react-i18next'
import { Input } from '@/6-shared/ui/kit/Input'
import { FieldAddon } from '@/6-shared/ui/kit/Field'
import { Menu } from '@/6-shared/ui/kit/Menu'
import { MultiSelect } from '@/6-shared/ui/kit/MultiSelect'
import { AccountMultiSelect } from '../../../account/AccountMultiSelect'
import { Popover } from '@/6-shared/ui/kit/Popover'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { CloseIcon, FilterListIcon } from '@/6-shared/ui/Icons'
import { TransactionCreateButton } from '../../TransactionCreateButton'

type Clause = core.transactions.TTransactionFilterClause
type AddableFilterKind = Exclude<Clause['kind'], 'search' | 'date' | 'activity'>
type SelectKind = 'tag' | 'account' | 'type'
type EditableFilterKind = SelectKind | 'amount'
type AmountClause = Extract<Clause, { kind: 'amount' }>

type FilterProps = {
  query: core.transactions.TTransactionQuery
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  search: string
  onSearchChange: (search: string) => void
}

const filterKinds: AddableFilterKind[] = [
  'account',
  'tag',
  'type',
  'amount',
  'viewed',
  'deleted',
]

const Filter: FC<FilterProps> = ({
  query,
  onQueryChange,
  search,
  onSearchChange,
}) => {
  const { t, i18n } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const tags = useAppSelector(core.tags.selectPopulated)
  const chipRefs = useRef<Partial<Record<Clause['kind'], HTMLElement | null>>>(
    {}
  )
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const focusAfterRemoval = useRef<{ target: HTMLElement | null } | null>(null)
  const pendingEditingKind = useRef<EditableFilterKind | null>(null)
  const dropEmptyClause = (kind: EditableFilterKind) => {
    const clause = query.clauses.find(item => item.kind === kind)
    if (!clause || !isEmptyClause(clause)) return
    focusAfterRemoval.current = { target: addButtonRef.current }
    onQueryChange({ clauses: query.clauses.filter(item => item.kind !== kind) })
  }
  const menuPopup = usePopup()
  const amountPopup = usePopup(() => dropEmptyClause('amount'))
  const categoryPopup = usePopup(() => dropEmptyClause('tag'))
  const accountPopup = usePopup(() => dropEmptyClause('account'))
  const typePopup = usePopup(() => dropEmptyClause('type'))
  const selectPopups = {
    tag: categoryPopup,
    account: accountPopup,
    type: typePopup,
  }
  const appliedClauses = query.clauses
  const availableKinds = filterKinds.filter(
    kind => !appliedClauses.some(clause => clause.kind === kind)
  )

  useLayoutEffect(() => {
    if (!focusAfterRemoval.current) return
    const target = focusAfterRemoval.current.target
    focusAfterRemoval.current = null
    ;(target?.isConnected ? target : addButtonRef.current)?.focus()
  }, [query.clauses])

  const upsertClause = (clause: Clause) => {
    onQueryChange({
      clauses: [
        ...query.clauses.filter(item => item.kind !== clause.kind),
        clause,
      ],
    })
  }

  const chooseKind = (kind: AddableFilterKind) => {
    pendingEditingKind.current = isEditableKind(kind) ? kind : null
    upsertClause(makeDefaultClause(kind))
  }

  // Wait for the new chip to mount before opening its popup and moving focus.
  useLayoutEffect(() => {
    const kind = pendingEditingKind.current
    if (!kind) return
    pendingEditingKind.current = null
    if (isSelectKind(kind)) selectPopups[kind].setOpen(true)
    else amountPopup.setOpen(true)
  })

  const removeClause = (clause: Clause) => {
    const index = query.clauses.indexOf(clause)
    const neighbour = query.clauses[index + 1] ?? query.clauses[index - 1]
    focusAfterRemoval.current = {
      target: neighbour ? (chipRefs.current[neighbour.kind] ?? null) : null,
    }
    if (clause.kind === 'amount') amountPopup.setOpen(false)
    onQueryChange({
      clauses: query.clauses.filter(item => item !== clause),
    })
  }

  const labels = useMemo(
    () => ({ accounts, envelopes, tags, t, language: i18n.language }),
    [accounts, envelopes, i18n.language, tags, t]
  )

  return (
    <div className="flex flex-col gap-2 rounded-ui-card rounded-smooth bg-ui-card p-2 text-ui-primary shadow-ui-card">
      <Input
        label={t('searchComments')}
        placeholder={t('searchComments')}
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        end={
          <FieldAddon kind="action">
            {Boolean(search) && (
              <IconButton
                size="sm"
                variant="ghost"
                label={t('clearField')}
                onClick={() => onSearchChange('')}
              >
                <CloseIcon />
              </IconButton>
            )}
            <TransactionCreateButton query={query} />
            <Menu
              label={t('addFilter')}
              popup={menuPopup}
              disabled={!availableKinds.length}
              trigger={
                <IconButton
                  ref={addButtonRef}
                  size="sm"
                  variant="ghost"
                  label={t('addFilter')}
                >
                  <FilterListIcon />
                </IconButton>
              }
              items={availableKinds.map(kind => ({
                id: kind,
                label: getKindLabel(kind, t),
                onSelect: () => chooseKind(kind),
              }))}
            />
          </FieldAddon>
        }
      />

      {!!appliedClauses.length && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
          {appliedClauses.map(clause => {
            const chip = (
              <Chip
                ref={element => {
                  chipRefs.current[clause.kind] = element
                }}
                onClick={() => {}}
                onRemove={() => removeClause(clause)}
              >
                {getClauseLabel(clause, labels)}
              </Chip>
            )
            switch (clause.kind) {
              case 'amount':
                return (
                  <Popover
                    key={clause.kind}
                    label={t('amount')}
                    popup={amountPopup}
                    trigger={chip}
                  >
                    <AmountFilterEditor
                      clause={clause}
                      onChange={upsertClause}
                    />
                  </Popover>
                )
              case 'tag':
                return (
                  <CategoryMultiSelect
                    key={clause.kind}
                    value={clause.ids}
                    onChange={ids => upsertClause({ ...clause, ids })}
                    popup={categoryPopup}
                    trigger={chip}
                  />
                )
              case 'account':
                return (
                  <AccountMultiSelect
                    key={clause.kind}
                    value={clause.ids}
                    onChange={ids => upsertClause({ ...clause, ids })}
                    popup={accountPopup}
                    trigger={chip}
                  />
                )
              case 'type':
                return (
                  <MultiSelect
                    key={clause.kind}
                    label={t('transactionType')}
                    value={clause.values}
                    onChange={values => upsertClause({ ...clause, values })}
                    popup={typePopup}
                    trigger={chip}
                    items={[
                      core.transactions.TrFilterType.Income,
                      core.transactions.TrFilterType.Outcome,
                      core.transactions.TrFilterType.Transfer,
                      core.transactions.TrFilterType.Debt,
                    ].map(value => ({ value, label: getTypeLabel(value, t) }))}
                  />
                )
              default:
                return (
                  <span key={clause.kind} className="min-w-0 max-w-full">
                    {chip}
                  </span>
                )
            }
          })}
        </div>
      )}
    </div>
  )
}

function AmountFilterEditor(props: {
  clause: AmountClause
  onChange: (clause: Clause) => void
}) {
  const { clause, onChange } = props
  const { t } = useTranslation('filterDrawer')

  return (
    <div className="flex flex-row gap-2">
      <Input
        labelMode="floating"
        className="min-w-0 flex-1"
        autoFocus
        type="number"
        label={t('amountFrom')}
        value={clause.gte ?? ''}
        onChange={event =>
          onChange({
            ...clause,
            gte: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
      <Input
        labelMode="floating"
        className="min-w-0 flex-1"
        type="number"
        label={t('amountTo')}
        value={clause.lte ?? ''}
        onChange={event =>
          onChange({
            ...clause,
            lte: event.target.value ? Number(event.target.value) : undefined,
          })
        }
      />
    </div>
  )
}

function makeDefaultClause(kind: AddableFilterKind): Clause {
  switch (kind) {
    case 'account':
      return { kind, ids: [] }
    case 'tag':
      return { kind, ids: [] }
    case 'type':
      return { kind, values: [] }
    case 'amount':
      return { kind }
    case 'viewed':
      return { kind, value: false }
    case 'deleted':
      return { kind, mode: 'include' }
  }
}

function isSelectKind(kind: Clause['kind']): kind is SelectKind {
  return kind === 'tag' || kind === 'account' || kind === 'type'
}

function isEditableKind(kind: Clause['kind']): kind is EditableFilterKind {
  return isSelectKind(kind) || kind === 'amount'
}

function isEmptyClause(clause: Clause): boolean {
  if (clause.kind === 'account' || clause.kind === 'tag')
    return !clause.ids.length
  if (clause.kind === 'type') return !clause.values.length
  if (clause.kind === 'amount') {
    return clause.gte === undefined && clause.lte === undefined
  }
  return false
}

function getClauseLabel(
  clause: Clause,
  context: {
    accounts: ReturnType<typeof core.accounts.usePopulated>
    envelopes: ReturnType<typeof core.envelopes.selectAll>
    tags: ReturnType<typeof core.tags.selectPopulated>
    t: ReturnType<typeof useTranslation>['t']
    language: string
  }
): string {
  const { accounts, envelopes, tags, t, language } = context
  switch (clause.kind) {
    case 'account':
      return clause.ids.length
        ? joinLabels(clause.ids, id => accounts[id]?.title || id)
        : t('account')
    case 'activity':
      if (clause.mode === core.transactions.TrFilterMode.TransferFees) {
        return t('transferFees')
      }
      return joinLabels(clause.envelopeIds, id => envelopes[id]?.name || id)
    case 'tag':
      return clause.ids.length
        ? joinLabels(clause.ids, id => tags[id]?.name || id)
        : t('category')
    case 'type':
      return clause.values.length
        ? clause.values.map(value => getTypeLabel(value, t)).join(', ')
        : t('transactionType')
    case 'amount':
      return getAmountLabel(clause, t, language)
    case 'date':
      if (clause.from && clause.to) {
        return `${t('date')}: ${clause.from}–${clause.to}`
      }
      if (clause.from) return `${t('dateFrom')} ${clause.from}`
      if (clause.to) return `${t('dateTo')} ${clause.to}`
      return t('date')
    case 'viewed':
      return clause.value ? t('viewed') : t('onlyNew')
    case 'deleted':
      return clause.mode === 'only' ? t('onlyDeleted') : t('showDeleted')
    case 'search':
      return clause.value
  }
}

function getAmountLabel(
  clause: AmountClause,
  t: ReturnType<typeof useTranslation>['t'],
  language: string
): string {
  const format = (value: number) =>
    new Intl.NumberFormat(language).format(value)

  if (clause.gte !== undefined && clause.lte !== undefined) {
    if (clause.gte === clause.lte)
      return `${t('amount')}: ${format(clause.gte)}`
    return `${t('amount')}: ${format(clause.gte)}–${format(clause.lte)}`
  }
  if (clause.gte !== undefined)
    return `${t('amountFrom')} ${format(clause.gte)}`
  if (clause.lte !== undefined) return `${t('amountTo')} ${format(clause.lte)}`
  return t('amount')
}

function getKindLabel(
  kind: AddableFilterKind,
  t: ReturnType<typeof useTranslation>['t']
) {
  switch (kind) {
    case 'account':
      return t('account')
    case 'tag':
      return t('category')
    case 'type':
      return t('transactionType')
    case 'amount':
      return t('amount')
    case 'viewed':
      return t('onlyNew')
    case 'deleted':
      return t('showDeleted')
  }
}

function getTypeLabel(
  type: core.transactions.TrFilterType,
  t: ReturnType<typeof useTranslation>['t']
) {
  switch (type) {
    case core.transactions.TrFilterType.Income:
      return t('transactionType_income')
    case core.transactions.TrFilterType.Outcome:
      return t('transactionType_outcome')
    case core.transactions.TrFilterType.Transfer:
      return t('transactionType_transfer')
    case core.transactions.TrFilterType.Debt:
      return t('transactionType_debt')
  }
}

function joinLabels<T>(values: T[], getLabel: (value: T) => string): string {
  const labels = values.map(getLabel)
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
}

export default Filter
