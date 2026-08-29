import { Button, IconButton } from '6-shared/ui/Button'
import type { TISODate, TTransaction, TTransactionId } from '6-shared/types'

import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Fab, Zoom } from '@mui/material'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import { Tooltip } from '6-shared/ui/Tooltip'
import {
  DeleteIcon,
  CloseIcon,
  RestoreFromTrashIcon,
} from '6-shared/ui/Icons'
import { AmountInput } from '6-shared/ui/AmountInput'
import { rateToWords } from '6-shared/helpers/money'
import { formatDate, parseDate } from '6-shared/helpers/date'
import { track } from '6-shared/analytics'

import { useAppCommand, useAppSelector } from 'store'

import { core } from 'zerro-core/redux'

import { TagList } from '../TagSelect/TagList'

import { Reciept } from './Reciept'
import { Map } from './Map'

/**
 * Empty state for transaction preview
 */
export const TrEmptyState = () => {
  const { t } = useTranslation('transaction')
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-disabled-foreground">
      <p className="m-0 text-center type-body-sm text-inherit">
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
  return transaction ? <TransactionContent {...props} /> : <TrEmptyState />
}

const TransactionContent: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onOpenOther, onSelectSimilar } = props
  const { t } = useTranslation('transaction')
  const remove = useAppCommand(core.transactions.remove)
  const removePermanently = useAppCommand(core.transactions.removePermanently)
  const restore = useAppCommand(core.transactions.restore)
  const recreate = useAppCommand(core.transactions.recreate)
  const update = useAppCommand(core.transactions.update)
  const onDelete = () => {
    remove([id])
    track('transaction_deleted', { mode: 'single', source: 'preview' })
  }
  const onDeletePermanently = () => {
    removePermanently([id])
    track('transaction_deleted_permanently', { source: 'preview' })
  }
  const onRestore = () => {
    restore(id)
    track('transaction_restored', { source: 'preview' })
  }

  const tr = useAppSelector(state => core.transactions.selectAll(state)[id])!
  const trType = core.transactions.getType(tr)
  const accounts = core.accounts.usePopulated()
  const incomeAccount = accounts[tr.incomeAccount]
  const outcomeAccount = accounts[tr.outcomeAccount]
  const instruments = core.instruments.useAll()
  const incomeCurrency = instruments[tr.incomeInstrument]?.shortTitle
  const outcomeCurrency = instruments[tr.outcomeInstrument]?.shortTitle

  const {
    date,
    changed,
    created,
    deleted,
    qrCode,
    income,
    outcome,
    tag,
    comment,
    payee,
    latitude,
    longitude,
  } = tr

  const [localComment, setLocalComment] = useState(tr.comment)
  const [localOutcome, setLocalOutcome] = useState(tr.outcome)
  const [localIncome, setLocalIncome] = useState(tr.income)
  const [localPayee, setLocalPayee] = useState(tr.payee)
  const [localDate, setLocalDate] = useState(tr.date)
  const [localTime, setLocalTime] = useState(formatDate(tr.created, 'HH:mm'))
  const [localTag, setLocalTag] = useState(tr.tag)

  const [prevTr, setPrevTr] = useState(tr)
  if (prevTr !== tr) {
    setPrevTr(tr)
    setLocalComment(tr.comment)
    setLocalOutcome(tr.outcome)
    setLocalIncome(tr.income)
    setLocalPayee(tr.payee)
    setLocalDate(tr.date)
    setLocalTime(formatDate(tr.created, 'HH:mm'))
    setLocalTag(tr.tag)
  }

  const timeChanged = formatDate(tr.created, 'HH:mm') !== localTime

  const hasChanges =
    comment !== localComment ||
    outcome !== localOutcome ||
    income !== localIncome ||
    payee !== localPayee ||
    date !== localDate ||
    localTag !== tag ||
    timeChanged

  const onSave = () => {
    if (timeChanged) {
      const hh = +localTime.split(':')[0]
      const mm = +localTime.split(':')[1]
      const createdDate = parseDate(tr.date)
      createdDate.setHours(hh)
      createdDate.setMinutes(mm)
      const newId = recreate({
        id,
        created: +createdDate,
        comment: localComment,
        outcome: localOutcome,
        income: localIncome,
        payee: localPayee,
        date: localDate,
        tag: localTag,
      })
      track('transaction_recreated', { source: 'preview' })
      onOpenOther(newId)
    } else if (hasChanges) {
      update({
        id,
        ...(comment !== localComment && { comment: localComment }),
        ...(outcome !== localOutcome && { outcome: localOutcome }),
        ...(income !== localIncome && { income: localIncome }),
        ...(payee !== localPayee && { payee: localPayee }),
        ...(date !== localDate && { date: localDate }),
        ...(tag !== localTag && { tag: localTag }),
      })
      track('transaction_edited', { source: 'preview' })
    }
  }

  const titles = {
    income: t('type_income'),
    outcome: t('type_outcome'),
    transfer: t('type_transfer'),
    incomeDebt: t('type_debt'),
    outcomeDebt: t('type_debt'),
  }

  return (
    <div className="relative min-w-80">
      <Head
        title={titles[trType]}
        onClose={onClose}
        onDelete={onDelete}
        onDeletePermanently={onDeletePermanently}
        onRestore={onRestore}
        deleted={deleted}
      />
      {(trType === 'income' || trType === 'outcome') && (
        <TagList
          tags={localTag}
          onChange={setLocalTag}
          tagType={trType}
          className="bg-background px-6 py-4"
        />
      )}
      <div className="flex flex-col gap-8 p-6">
        {trType !== 'income' && (
          <AmountInput
            label={t('otcomeFrom', { account: outcomeAccount.title })}
            currency={outcomeCurrency}
            value={localOutcome}
            onChange={setLocalOutcome}
            selectOnFocus
            fullWidth
            size="small"
          />
        )}
        {trType !== 'outcome' && (
          <AmountInput
            label={t('incomeTo', { account: incomeAccount.title })}
            currency={incomeCurrency}
            value={localIncome}
            onChange={setLocalIncome}
            selectOnFocus
            fullWidth
            size="small"
          />
        )}
        <div className="flex flex-row gap-4">
          <OutlinedField
            label={t('date')}
            value={localDate}
            onChange={event => setLocalDate(event.target.value as TISODate)}
            type="date"
            fullWidth
            size="small"
          />
          {/* A native time input draws a picker button of its own, which MUI
              hid too. The field's own class lands on the frame, so the input
              is reached through it. */}
          <OutlinedField
            label={t('time')}
            value={localTime}
            onChange={e => setLocalTime(e.target.value)}
            type="time"
            size="small"
            className="min-w-[104px] [&_input]:appearance-none [&_input::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
        <OutlinedField
          label={t('payee')}
          value={localPayee || ''}
          onChange={e => setLocalPayee(e.target.value)}
          multiline
          maxRows={4}
          fullWidth
          size="small"
        />
        <OutlinedField
          label={t('comment')}
          value={localComment || ''}
          onChange={e => setLocalComment(e.target.value)}
          multiline
          maxRows={4}
          fullWidth
          size="small"
        />
        <Reciept value={qrCode} />
        <Map longitude={longitude} latitude={latitude} />

        <div className="flex flex-col gap-2 type-caption text-muted-foreground">
          <span>
            {t('created', {
              date: formatDate(created, 'dd MMM yyyy, HH:mm'),
            })}
          </span>
          <span>
            {t('changed', {
              date: formatDate(changed, 'dd MMM yyyy, HH:mm'),
            })}
          </span>
          <RateToWords tr={tr} />
        </div>

        {!!onSelectSimilar && (
          <Button onClick={() => onSelectSimilar(changed)}>
            {t('btnOtherFromSync')}
          </Button>
        )}
      </div>
      <SaveButton visible={hasChanges} onSave={onSave} />
    </div>
  )
}

const Head: FC<{
  title: string
  deleted: boolean
  onClose: () => void
  onDelete: () => void
  onDeletePermanently: () => void
  onRestore: () => void
}> = props => {
  const { title, deleted, onClose, onDelete, onDeletePermanently, onRestore } =
    props
  const { t } = useTranslation('transaction')
  return (
    <div className="flex items-center px-6 py-2">
      <div className="grow">
        {deleted && (
          <span className="truncate type-caption text-error">
            {t('transactionDeleted')}
          </span>
        )}
        <h2 className="m-0 truncate type-title">{title}</h2>
      </div>
      {deleted ? (
        <Tooltip title={t('btnRestore')}>
          <IconButton onClick={onRestore} children={<RestoreFromTrashIcon />} />
        </Tooltip>
      ) : (
        <Tooltip title={t('btnDelete')}>
          <IconButton
            onClick={e => (e.shiftKey ? onDeletePermanently() : onDelete())}
            children={<DeleteIcon />}
          />
        </Tooltip>
      )}
      <Tooltip title={t('btnClose')}>
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>
    </div>
  )
}

const SaveButton: FC<{ visible: boolean; onSave: () => void }> = props => {
  const { visible, onSave } = props
  const { t } = useTranslation('transaction')
  return (
    <div
      style={{ transform: 'translateX(-50%)' }}
      className="sticky bottom-4 left-1/2 z-[200] mt-8 inline-block"
    >
      <Zoom in={visible}>
        <Fab variant="extended" color="primary" onClick={onSave}>
          {t('btnSave')}
        </Fab>
      </Zoom>
    </div>
  )
}

const RateToWords: FC<{ tr: TTransaction }> = ({ tr }) => {
  const { t } = useTranslation('transaction')
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

  if (rate) {
    return <span>{t('rate', { rate })}</span>
  }
  return null
}
