import type { FC, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TAccountId, TTransaction, TTransactionId } from '@/6-shared/types'
import { Button, IconButton } from '@/6-shared/ui/Button'
import { BigAmountInput } from '@/6-shared/ui/BigAmountInput'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { useShake } from '@/6-shared/ui/useShake'
import { FilledInput } from '@/6-shared/ui/FilledField'
import {
  CloseIcon,
  NotesIcon,
  MoneyInIcon,
  MoneyOutIcon,
  ArrowDownwardIcon,
} from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { formatDate, formatTimeAgo } from '@/6-shared/helpers/date'
import { rateToWords } from '@/6-shared/helpers/money'
import { track } from '@/6-shared/analytics'
import { useAppCommand, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { SmartAmount } from '@/3-widgets/Amount'

import { AccountField } from './AccountField'
import { ActionsMenu } from './ActionsMenu'
import { AmountField } from './AmountField'
import { CategoryRow } from './CategoryRow'
import { DateTimeField } from './DateTimeField'
import { MerchantField } from './MerchantField'
import { TypeSelect, draftTypes } from './TypeSelect'
import { Receipt } from './Receipt'
import { Map } from './Map'
import type {
  TDraftContext,
  TDraftField,
  TDraftIssues,
  TTransactionDraft,
} from './draft'
import {
  changedFields,
  draftCreated,
  draftIssues,
  hasIssues,
  isDebt,
  isIncoming,
  newMerchantTitle,
  setDraftMerchant,
  setDraftType,
  setTransferAccount,
  setTransferAmount,
  swapTransferSides,
  staleRates,
  timeChanged,
  toDraft,
  toPatch,
} from './draft'

/** Empty state for transaction preview */
export const TrEmptyState = () => {
  const { t } = useTranslation('transaction')
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-disabled-foreground">
      <p className="m-0 text-center text-body-sm text-inherit">
        {t('fullEmptyState')}
      </p>
    </div>
  )
}

export type TransactionPreviewProps = {
  id: string
  onClose: () => void
  onOpenOther: (id: TTransactionId) => void
  onSelectSimilar?: (date: number) => void
}

export const TransactionPreview: FC<TransactionPreviewProps> = props => {
  const transaction = useAppSelector(
    state => core.transactions.selectAll(state)[props.id]
  )
  return transaction ? <TransactionEditor {...props} /> : <TrEmptyState />
}

const TransactionEditor: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onOpenOther, onSelectSimilar } = props
  const { t } = useTranslation('transaction')
  const tr = useAppSelector(state => core.transactions.selectAll(state)[id])!

  const remove = useAppCommand(core.transactions.remove)
  const restore = useAppCommand(core.transactions.restore)
  const recreate = useAppCommand(core.transactions.recreate)
  const update = useAppCommand(core.transactions.update)

  const accounts = core.accounts.usePopulated()
  const instruments = core.instruments.useAll()
  const debtAccountId = useAppSelector(core.accounts.selectDebtAccountId)

  /** Every account a leg may be moved to. The debt account is not one of
   * them: it is reached by choosing a debt type, not by naming it. An
   * archived account is offered only while it is the one already in use, so
   * an old transaction stays editable without the list growing back. */
  const options = useMemo(() => {
    const list = Object.values(accounts)
      .filter(account => account.id !== debtAccountId)
      .filter(
        account =>
          !account.archive ||
          account.id === tr.incomeAccount ||
          account.id === tr.outcomeAccount
      )
      .map(account => ({
        id: account.id,
        title: account.title,
        fxCode: account.fxCode,
        archive: account.archive,
      }))
    list.sort((a, b) => Number(a.archive) - Number(b.archive))
    return list
  }, [accounts, debtAccountId, tr.incomeAccount, tr.outcomeAccount])

  const ctx: TDraftContext = useMemo(
    () => ({
      accountIds: options.map(option => option.id),
      instrumentOf: (accountId: TAccountId) => accounts[accountId]?.instrument,
      debtAccountId,
    }),
    [options, accounts, debtAccountId]
  )

  const [draft, setDraft] = useState(() => toDraft(tr, ctx))
  // Nothing is wrong until saving has been asked for and refused, and what it
  // refused over is remembered by field. A mark leaves for good the moment
  // its field is right — breaking the same field again says nothing until
  // saving is refused a second time.
  const [marked, setMarked] = useState<readonly TDraftField[]>([])
  const [headline, shakeHeadline] = useShake<HTMLLabelElement>()
  // A transaction arriving from a sync, or the replacement a save just made,
  // replaces what is being edited. Comparing the entity rather than its id:
  // the id is the same one after a field of it changed elsewhere.
  const [source, setSource] = useState(tr)
  if (source !== tr) {
    setSource(tr)
    setDraft(toDraft(tr, ctx))
    setMarked([])
  }

  const transfer = draft.type === 'transfer'
  const categorized = draft.type === 'income' || draft.type === 'outcome'
  const patch = toPatch(draft, ctx)
  // The rates a moved leg invalidates are part of the same save.
  const claimed = patch ? { ...patch, ...staleRates(patch, tr) } : null
  const changes = claimed ? changedFields(tr, claimed) : {}
  const recreated = timeChanged(draft, tr)
  const issues = draftIssues(draft)
  // A merchant that has yet to be created is a change all by itself: the
  // patch cannot name it, so nothing in `changes` would show it.
  const newMerchant = newMerchantTitle(draft)
  const dirty = recreated || !!newMerchant || Object.keys(changes).length > 0
  const stillWrong = marked.filter(field => issues[field])
  if (stillWrong.length !== marked.length) setMarked(stillWrong)
  const marks: TDraftIssues = Object.fromEntries(
    stillWrong.map(field => [field, issues[field]])
  )

  /** Types this transaction has nowhere to go: a transfer needs a second
   * account, and a debt needs the account ZenMoney keeps them on. */
  const unavailable = useMemo(
    () =>
      draftTypes.filter(type => {
        if (type === 'transfer') return options.length < 2
        return isDebt(type) && !debtAccountId
      }),
    [options.length, debtAccountId]
  )

  const edit = (next: Partial<TTransactionDraft>) =>
    setDraft(current => ({ ...current, ...next }))

  const onSave = () => {
    if (!claimed || !dirty) return
    if (hasIssues(issues)) {
      setMarked(Object.keys(issues) as TDraftField[])
      if (issues.amount) shakeHeadline()
      return
    }
    if (recreated) {
      const newId = recreate(
        { id, ...claimed, created: draftCreated(draft, tr.created) },
        newMerchant ?? undefined
      )
      track('transaction_recreated', { source: 'preview' })
      onOpenOther(newId)
      return
    }
    update({ id, ...changes }, newMerchant ?? undefined)
    track('transaction_edited', { source: 'preview' })
  }

  /** What an account counts in, spelled the short way an amount is labelled
   * with — `CZK` rather than the instrument it comes from. */
  const currencyOf = (accountId: TAccountId) => {
    const instrument = ctx.instrumentOf(accountId)
    return instrument === undefined
      ? undefined
      : instruments[instrument]?.shortTitle
  }

  return (
    <div className="flex min-h-full min-w-80 flex-col bg-card">
      <header className="flex items-center gap-1 px-6 py-3">
        <div className="min-w-0 grow">
          {tr.deleted && (
            <span className="block truncate text-caption text-error">
              {t('transactionDeleted')}
            </span>
          )}
          <TypeSelect
            value={draft.type}
            unavailable={unavailable}
            onChange={type => setDraft(setDraftType(draft, type, ctx))}
          />
        </div>
        <ActionsMenu
          deleted={tr.deleted}
          onDelete={() => {
            remove([id])
            track('transaction_deleted', { mode: 'single', source: 'preview' })
          }}
          onRestore={() => {
            // Restoring makes a copy under a new id — the server's deletion
            // cannot be taken back — so this screen is left naming a
            // tombstone. It closes rather than going on offering a Restore
            // that would make a second copy.
            restore(id)
            track('transaction_restored', { source: 'preview' })
            onClose()
          }}
          onSelectSimilar={
            onSelectSimilar ? () => onSelectSimilar(tr.changed) : undefined
          }
        />
        <IconButton size="small" aria-label={t('btnClose')} onClick={onClose}>
          <CloseIcon size={20} />
        </IconButton>
      </header>

      <div className="flex flex-col gap-3 px-6">
        {transfer ? (
          <div className="relative flex flex-col gap-3">
            <FieldGroup>
              <AccountField
                className="rounded-b-md"
                invalid={!!marks.fromAccount}
                label={t('accountFrom')}
                value={draft.fromAccount}
                options={options}
                onChange={account =>
                  setDraft(setTransferAccount(draft, 'from', account, ctx))
                }
              />
              <AmountField
                className="rounded-t-md"
                invalid={!!marks.fromAmount}
                label={t('amountFrom')}
                icon={<MoneyOutIcon size={20} />}
                value={draft.fromAmount}
                currency={currencyOf(draft.fromAccount)}
                onChange={amount =>
                  setDraft(setTransferAmount(draft, 'from', amount, ctx))
                }
              />
            </FieldGroup>
            <FieldGroup>
              <AccountField
                className="rounded-b-md"
                invalid={!!marks.toAccount}
                error={marks.toAccount && t(`issue_${marks.toAccount}`)}
                label={t('accountTo')}
                value={draft.toAccount}
                options={options}
                onChange={account =>
                  setDraft(setTransferAccount(draft, 'to', account, ctx))
                }
              />
              <AmountField
                className="rounded-t-md"
                invalid={!!marks.toAmount}
                label={t('amountTo')}
                icon={<MoneyInIcon size={20} />}
                value={draft.toAmount}
                currency={currencyOf(draft.toAccount)}
                onChange={amount =>
                  setDraft(setTransferAmount(draft, 'to', amount, ctx))
                }
              />
            </FieldGroup>
            {/* Centred on the seam between the two halves, and it turns the
                transfer around rather than turning the arrow around: the
                arrow states which way money moves, and that never changes. */}
            <button
              type="button"
              aria-label={t('btnSwap')}
              onClick={() => setDraft(swapTransferSides(draft))}
              className="absolute top-1/2 left-1/2 inline-flex size-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-solid border-card bg-muted p-0 text-foreground hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowDownwardIcon size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex min-h-50 flex-col justify-center gap-4 py-8">
              <div className="flex flex-col items-center gap-1">
                <OriginalAmount tr={tr} />
                <BigAmountInput
                  ref={headline}
                  value={draft.amount}
                  onChange={amount => edit({ amount })}
                  onEnter={onSave}
                  currency={currencyOf(draft.account)}
                  sign={isIncoming(draft.type) ? '+' : '−'}
                  aria-label={t('amount')}
                  invalid={!!marks.amount}
                />
              </div>
              {categorized && (
                <CategoryRow
                  tags={draft.tag}
                  tagType={draft.type === 'income' ? 'income' : 'outcome'}
                  onChange={tag => edit({ tag })}
                />
              )}
            </div>
            <AccountField
              label={t('account')}
              value={draft.account}
              options={options}
              onChange={account => edit({ account })}
            />
          </>
        )}

        <DateTimeField
          date={draft.date}
          onDateChange={date => edit({ date })}
          time={draft.time}
          onTimeChange={time => edit({ time })}
        />

        {!transfer && (
          <MerchantField
            invalid={!!marks.payee}
            error={marks.payee && t(`issue_${marks.payee}`)}
            payee={draft.payee}
            originalPayee={tr.originalPayee}
            merchant={draft.merchant}
            debt={isDebt(draft.type)}
            placeholder={isDebt(draft.type) ? t('debtor') : t('payee')}
            onChange={named => setDraft(setDraftMerchant(draft, named))}
          />
        )}

        <FilledInput
          icon={<NotesIcon size={20} />}
          placeholder={t('comment')}
          aria-label={t('comment')}
          multiline
          maxRows={6}
          value={draft.comment ?? ''}
          onChange={event => edit({ comment: event.target.value })}
        />

        <Receipt value={tr.qrCode} />
        <Map longitude={tr.longitude} latitude={tr.latitude} />

        <div className="flex flex-col items-center gap-1 py-4 text-body-sm text-muted-foreground">
          <span>
            {t('created', { date: formatDate(tr.created, 'dd.MM.yyyy HH:mm') })}
          </span>
          <span>{t('changedAgo', { ago: formatTimeAgo(tr.changed) })}</span>
          <RateToWords tr={tr} />
        </div>
      </div>

      {/* No button at all until there is something to save: a permanently
          disabled control is a question a person keeps re-reading. */}
      {dirty && (
        <div className="sticky bottom-0 mt-auto bg-card px-6 pt-2 pb-6">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={onSave}
            className="h-12 rounded-xl"
          >
            {t('btnSave')}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Rows that belong to one thing: an account and what it moves. They close up
 * into a block, so the pair reads as one field with two lines rather than two
 * unrelated ones. */
const FieldGroup: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex flex-col gap-0.5', className)}>{children}</div>

const OriginalAmount: FC<{ tr: TTransaction }> = ({ tr }) => {
  const type = core.transactions.getType(tr)
  const original = type === 'income' ? tr.opIncome : tr.opOutcome
  const instrument =
    type === 'income' ? tr.opIncomeInstrument : tr.opOutcomeInstrument

  if (!original || !instrument || (type !== 'income' && type !== 'outcome')) {
    return null
  }

  return (
    <Tooltip title={<RateToWords tr={tr} />} placement="top">
      <SmartAmount
        value={original}
        instrument={instrument}
        decimals="ifAny"
        noShade
        tabIndex={0}
        className="rounded-sm text-body-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
    </Tooltip>
  )
}

const RateToWords: FC<{ tr: TTransaction }> = ({ tr }) => {
  const trType = core.transactions.getType(tr)
  const { income, opIncome, outcome, opOutcome } = tr
  const instruments = core.instruments.useAll()
  const incomeCurrency = instruments[tr.incomeInstrument]?.shortTitle
  const opIncomeCurrency =
    tr.opIncomeInstrument && instruments[tr.opIncomeInstrument]?.shortTitle
  const outcomeCurrency = instruments[tr.outcomeInstrument]?.shortTitle
  const opOutcomeCurrency =
    tr.opOutcomeInstrument && instruments[tr.opOutcomeInstrument]?.shortTitle

  let rate = ''

  if (trType === 'income' && opIncome && opIncomeCurrency) {
    rate = rateToWords(income, incomeCurrency, opIncome, opIncomeCurrency)
  }
  if (trType === 'outcome' && opOutcome && opOutcomeCurrency) {
    rate = rateToWords(outcome, outcomeCurrency, opOutcome, opOutcomeCurrency)
  }
  if (trType === 'transfer' && incomeCurrency !== outcomeCurrency) {
    rate = rateToWords(outcome, outcomeCurrency, income, incomeCurrency)
  }

  return rate || null
}
