import type { TTransaction, TTransactionId } from '6-shared/types'

import React, { useState, useEffect, FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Fab,
  Zoom,
  Button,
  Stack,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Tooltip } from '6-shared/ui/Tooltip'
import {
  DeleteIcon,
  CloseIcon,
  RestoreFromTrashIcon,
  CalendarIcon,
} from '6-shared/ui/Icons'
import { AmountInput } from '6-shared/ui/AmountInput'
import { rateToWords } from '6-shared/helpers/money'
import { formatDate, parseDate, toISODate } from '6-shared/helpers/date'

import { useAppDispatch } from 'store'

import { trModel } from '5-entities/transaction'
import { accountModel } from '5-entities/account'
import { instrumentModel } from '5-entities/currency/instrument'
import { TagList } from '5-entities/tag/ui/TagList'

import { Reciept } from './Reciept'
import { Map } from './Map'

/**
 * Empty state for transaction preview
 */
export const TrEmptyState = () => {
  const { t } = useTranslation('transaction')
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      color="text.hint"
      p={3}
    >
      <Typography variant="body2" align="center" color="inherit">
        {t('fullEmptyState')}
      </Typography>
    </Box>
  )
}

export type TransactionPreviewProps = {
  id: string
  onClose: () => void
  onOpenOther: (id: TTransactionId) => void
  onSelectSimilar?: (date: number) => void
}

export const TransactionPreview: FC<TransactionPreviewProps> = props => {
  const transaction = trModel.useTransactions()[props.id]
  return transaction ? <TransactionContent {...props} /> : <TrEmptyState />
}

const TransactionContent: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onOpenOther, onSelectSimilar } = props
  const { t } = useTranslation('transaction')
  const dispatch = useAppDispatch()
  const onDelete = () => dispatch(trModel.deleteTransactions([id]))
  const onDeletePermanently = () =>
    dispatch(trModel.deleteTransactionsPermanently([id]))
  const onRestore = () => dispatch(trModel.restoreTransaction(id))
  // onSplit: id => dispatch(splitTransfer(id)), // does not work

  const tr = trModel.useTransactions()[id]
  const trType = trModel.getType(tr)
  const incomeAccount = accountModel.usePopulatedAccounts()[tr.incomeAccount]
  const outcomeAccount = accountModel.usePopulatedAccounts()[tr.outcomeAccount]
  const instruments = instrumentModel.useInstruments()
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

  useEffect(() => {
    setLocalComment(tr.comment)
    setLocalOutcome(tr.outcome)
    setLocalIncome(tr.income)
    setLocalPayee(tr.payee)
    setLocalDate(tr.date)
    setLocalTime(formatDate(tr.created, 'HH:mm'))
    setLocalTag(tr.tag)
  }, [tr])

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
      let createdDate = parseDate(tr.date)
      createdDate.setHours(hh)
      createdDate.setMinutes(mm)
      let newId = dispatch(
        trModel.recreateTransaction({
          id,
          created: +createdDate,
          comment: localComment,
          outcome: localOutcome,
          income: localIncome,
          payee: localPayee,
          date: localDate,
          tag: localTag,
        })
      ) as unknown
      onOpenOther(newId as string)
    } else if (hasChanges) {
      dispatch(
        trModel.applyChangesToTransaction({
          id,
          comment: localComment,
          outcome: localOutcome,
          income: localIncome,
          payee: localPayee,
          date: localDate,
          tag: localTag,
        })
      )
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
    <Box minWidth={320} position="relative">
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
          px={3}
          py={2}
          bgcolor="background.default"
        />
      )}

      <Stack spacing={4} p={3}>
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
        <Stack direction="row" spacing={2}>
          <DatePicker
            label={t('date')}
            value={parseDate(localDate)}
            onChange={date => date && setLocalDate(toISODate(date))}
            showDaysOutsideCurrentMonth
            format="dd.MM.yyyy"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            slots={{ openPickerIcon: CalendarIcon }}
          />
          <TextField
            label={t('time')}
            value={localTime}
            onChange={e => setLocalTime(e.target.value)}
            type="time"
            size="small"
            inputProps={{
              sx: {
                appearance: 'none',
                '::-webkit-calendar-picker-indicator': { display: 'none' },
              },
            }}
            sx={{ minWidth: 104 }}
          />
        </Stack>
        <TextField
          label={t('payee')}
          value={localPayee || ''}
          onChange={e => setLocalPayee(e.target.value)}
          multiline
          maxRows="4"
          fullWidth
          helperText=""
          size="small"
        />
        <TextField
          label={t('comment')}
          value={localComment || ''}
          onChange={e => setLocalComment(e.target.value)}
          multiline
          maxRows="4"
          fullWidth
          helperText=""
          size="small"
        />
        <Reciept value={qrCode} />
        <Map longitude={longitude} latitude={latitude} />

        <Stack
          spacing={1}
          sx={{ typography: 'caption', color: 'text.secondary' }}
        >
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
        </Stack>

        {!!onSelectSimilar && (
          <Button onClick={() => onSelectSimilar(changed)}>
            {t('btnOtherFromSync')}
          </Button>
        )}
      </Stack>

      <SaveButton visible={hasChanges} onSave={onSave} />
    </Box>
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
    <Box py={1} px={3} display="flex" alignItems="center">
      <Box flexGrow={1}>
        {deleted && (
          <Typography variant="caption" color="error" noWrap>
            {t('transactionDeleted')}
          </Typography>
        )}
        <Typography variant="h6" noWrap>
          {title}
        </Typography>
      </Box>

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
    </Box>
  )
}

const SaveButton: FC<{ visible: boolean; onSave: () => void }> = props => {
  const { visible, onSave } = props
  const { t } = useTranslation('transaction')
  return (
    <Box
      mt={4}
      zIndex={200}
      position="sticky"
      bottom={16}
      left="50%"
      display="inline-block"
      style={{ transform: 'translateX(-50%)' }}
    >
      <Zoom in={visible}>
        <Fab variant="extended" color="primary" onClick={onSave}>
          {t('btnSave')}
        </Fab>
      </Zoom>
    </Box>
  )
}

const RateToWords: FC<{ tr: TTransaction }> = ({ tr }) => {
  const { t } = useTranslation('transaction')
  const trType = trModel.getType(tr)
  const { income, opIncome, outcome, opOutcome } = tr
  const instruments = instrumentModel.useInstruments()
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
