import type { Dispatch, FC, MouseEvent, SetStateAction } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Chip,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
} from '@mui/material'
import { core } from 'zerro-core/redux'
import { useAppSelector } from 'store'
import { AddIcon, CloseIcon, FilterListIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'

type Clause = core.transactions.TTransactionFilterClause
type AddableFilterKind = Exclude<Clause['kind'], 'search' | 'date' | 'activity'>
type EditableFilterKind = Exclude<AddableFilterKind, 'viewed' | 'deleted'>

type FilterProps = {
  query: core.transactions.TTransactionQuery
  setQuery: Dispatch<SetStateAction<core.transactions.TTransactionQuery>>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
}

const filterKinds: AddableFilterKind[] = [
  'account',
  'tag',
  'type',
  'amount',
  'viewed',
  'deleted',
]

const Filter: FC<FilterProps> = ({ query, setQuery, search, setSearch }) => {
  const { t, i18n } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const tags = useAppSelector(core.tags.selectPopulated)
  const chipRefs = useRef<Partial<Record<Clause['kind'], HTMLElement | null>>>(
    {}
  )
  const pendingEditingKind = useRef<EditableFilterKind | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [editingKind, setEditingKind] = useState<EditableFilterKind | null>(
    null
  )
  const [editorOptionsOpen, setEditorOptionsOpen] = useState(false)
  const appliedClauses = query.clauses
  const editingClause = editingKind
    ? query.clauses.find(clause => clause.kind === editingKind)
    : undefined
  const availableKinds = filterKinds.filter(
    kind => !appliedClauses.some(clause => clause.kind === kind)
  )

  const upsertClause = (clause: Clause) => {
    setQuery(current => ({
      clauses: [
        ...current.clauses.filter(item => item.kind !== clause.kind),
        clause,
      ],
    }))
  }

  const openAddMenu = (event: MouseEvent<HTMLElement>) => {
    pendingEditingKind.current = null
    setEditorOptionsOpen(false)
    setEditingKind(null)
    setMenuAnchor(event.currentTarget)
  }

  const chooseKind = (kind: AddableFilterKind) => {
    upsertClause(makeDefaultClause(kind))
    pendingEditingKind.current = isEditableKind(kind) ? kind : null
    setMenuAnchor(null)
  }

  const openPendingEditor = () => {
    const kind = pendingEditingKind.current
    pendingEditingKind.current = null
    if (!kind) return

    setEditorOptionsOpen(false)
    setEditingKind(kind)
  }

  const openEditor = (clause: Clause) => {
    if (isEditableKind(clause.kind)) {
      setEditorOptionsOpen(false)
      setEditingKind(clause.kind)
    }
  }

  const closeEditor = () => {
    if (editingClause && isEmptyClause(editingClause)) {
      setQuery(current => ({
        clauses: current.clauses.filter(
          clause => clause.kind !== editingClause.kind
        ),
      }))
    }
    setEditorOptionsOpen(false)
    setEditingKind(null)
  }

  const removeClause = (clause: Clause) => {
    if (editingKind === clause.kind) {
      setEditorOptionsOpen(false)
      setEditingKind(null)
    }
    setQuery(current => ({
      clauses: current.clauses.filter(item => item !== clause),
    }))
  }

  const labels = useMemo(
    () => ({ accounts, envelopes, tags, t, language: i18n.language }),
    [accounts, envelopes, i18n.language, tags, t]
  )

  return (
    <Paper
      elevation={10}
      sx={{ p: 0.75, display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 36, px: 1 }}>
        <InputBase
          value={search}
          placeholder={t('searchComments')}
          onChange={event => setSearch(event.target.value)}
          sx={{ flexGrow: 1 }}
        />
        {Boolean(search) && (
          <Tooltip title={t('clearField')}>
            <IconButton
              size="small"
              onClick={() => setSearch('')}
              children={<CloseIcon />}
            />
          </Tooltip>
        )}
        {!appliedClauses.length && (
          <Tooltip title={t('addFilter')}>
            <IconButton
              size="small"
              color="primary"
              onClick={openAddMenu}
              children={<FilterListIcon />}
            />
          </Tooltip>
        )}
      </Box>

      {!!appliedClauses.length && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.75,
            px: 0.5,
            pt: 0.5,
          }}
        >
          {appliedClauses.map(clause => (
            <Chip
              ref={element => {
                chipRefs.current[clause.kind] = element
              }}
              key={clause.kind}
              size="small"
              label={getClauseLabel(clause, labels)}
              onClick={
                isEditableKind(clause.kind)
                  ? () => openEditor(clause)
                  : undefined
              }
              onDelete={() => removeClause(clause)}
            />
          ))}
          {!!availableKinds.length && (
            <Tooltip title={t('addFilter')}>
              <IconButton
                size="small"
                color="primary"
                onClick={openAddMenu}
                children={<AddIcon />}
              />
            </Tooltip>
          )}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transitionDuration={0}
        slotProps={{ transition: { onExited: openPendingEditor } }}
      >
        {availableKinds.map(kind => (
          <MenuItem key={kind} onClick={() => chooseKind(kind)}>
            {getKindLabel(kind, t)}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        anchorEl={() =>
          editingKind ? chipRefs.current[editingKind] || null : null
        }
        open={Boolean(editingClause)}
        onClose={closeEditor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          transition: {
            onEntered: () => setEditorOptionsOpen(true),
            onExit: () => setEditorOptionsOpen(false),
          },
        }}
      >
        {editingClause && (
          <Box sx={{ width: 340, maxWidth: '90vw', p: 1.5 }}>
            <FilterEditor
              clause={editingClause}
              onChange={upsertClause}
              optionsOpen={editorOptionsOpen}
              onOptionsOpen={() => setEditorOptionsOpen(true)}
              onOptionsClose={() => setEditorOptionsOpen(false)}
            />
          </Box>
        )}
      </Popover>
    </Paper>
  )
}

function FilterEditor(props: {
  clause: Clause
  onChange: (clause: Clause) => void
  optionsOpen: boolean
  onOptionsOpen: () => void
  onOptionsClose: () => void
}) {
  const { clause, onChange, optionsOpen, onOptionsOpen, onOptionsClose } = props
  const { t } = useTranslation('filterDrawer')
  const accounts = core.accounts.usePopulated()
  const tags = useAppSelector(core.tags.selectPopulated)

  switch (clause.kind) {
    case 'account':
      return (
        <Autocomplete
          multiple
          open={optionsOpen}
          onOpen={onOptionsOpen}
          onClose={onOptionsClose}
          disableCloseOnSelect
          options={Object.keys(accounts)}
          value={clause.ids}
          getOptionLabel={id => accounts[id]?.title || id}
          onChange={(_, ids) => onChange({ ...clause, ids })}
          renderInput={params => (
            <TextField {...params} autoFocus label={t('account')} />
          )}
        />
      )
    case 'tag':
      return (
        <Autocomplete
          multiple
          open={optionsOpen}
          onOpen={onOptionsOpen}
          onClose={onOptionsClose}
          disableCloseOnSelect
          options={Object.keys(tags)}
          value={clause.ids}
          getOptionLabel={id => tags[id]?.name || id}
          onChange={(_, ids) => onChange({ ...clause, ids })}
          renderInput={params => (
            <TextField {...params} autoFocus label={t('category')} />
          )}
        />
      )
    case 'type':
      return (
        <Autocomplete
          multiple
          open={optionsOpen}
          onOpen={onOptionsOpen}
          onClose={onOptionsClose}
          disableCloseOnSelect
          options={[
            core.transactions.TrFilterType.Income,
            core.transactions.TrFilterType.Outcome,
            core.transactions.TrFilterType.Transfer,
            core.transactions.TrFilterType.Debt,
          ]}
          value={clause.values}
          getOptionLabel={value => getTypeLabel(value, t)}
          onChange={(_, values) => onChange({ ...clause, values })}
          renderInput={params => (
            <TextField {...params} autoFocus label={t('transactionType')} />
          )}
        />
      )
    case 'amount':
      return (
        <Stack direction="row" gap={1}>
          <TextField
            autoFocus
            type="number"
            label={t('amountFrom')}
            value={clause.gte ?? ''}
            onChange={event =>
              onChange({
                ...clause,
                gte: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
          <TextField
            type="number"
            label={t('amountTo')}
            value={clause.lte ?? ''}
            onChange={event =>
              onChange({
                ...clause,
                lte: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </Stack>
      )
    case 'activity':
    case 'viewed':
    case 'deleted':
    case 'date':
    case 'search':
      return null
  }
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

function isEditableKind(kind: Clause['kind']): kind is EditableFilterKind {
  return (
    kind === 'account' || kind === 'tag' || kind === 'type' || kind === 'amount'
  )
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
  clause: Extract<Clause, { kind: 'amount' }>,
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
