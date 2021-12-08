import React, { useState, useEffect, FC } from 'react'
import { Reciept } from './Reciept'
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
import { Tooltip } from 'components/Tooltip'
import { DeleteIcon, CloseIcon, RestoreFromTrashIcon } from 'components/Icons'
import DatePicker from '@mui/lab/DatePicker'
import { Map } from './Map'
import { AmountInput } from 'components/AmountInput'
import { formatDate, rateToWords } from 'helpers/format'
import { TagList } from 'components/TagList'
import { useDispatch, useSelector } from 'react-redux'
import { getTransactions } from 'store/data/transactions'
import { getType } from 'store/data/transactions/helpers'
import { getPopulatedAccounts } from 'store/data/accounts'
import { getInstruments } from 'store/data/instruments'
import {
  applyChangesToTransaction,
  deleteTransactions,
  deleteTransactionsPermanently,
  recreateTransaction,
  restoreTransaction,
} from 'store/data/transactions/thunks'
import { Transaction } from 'types'

type TransactionPreviewProps = {
  id: string
  onClose: () => void
  onOpenOther: (id: string) => void
  onSelectSimilar: (date: number) => void
}

export const TransactionPreview: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onOpenOther, onSelectSimilar } = props
  const dispatch = useDispatch()
  const onDelete = () => dispatch(deleteTransactions([id]))
  const onDeletePermanently = () =>
    dispatch(deleteTransactionsPermanently([id]))
  const onRestore = () => dispatch(restoreTransaction(id))
  // onSplit: id => dispatch(splitTransfer(id)), // does not work

  const tr = useSelector(getTransactions)[id]
  const trType = getType(tr)
  const incomeAccount = useSelector(getPopulatedAccounts)[tr.incomeAccount]
  const outcomeAccount = useSelector(getPopulatedAccounts)[tr.outcomeAccount]
  const instruments = useSelector(getInstruments)
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
      let createdDate = new Date(tr.date)
      createdDate.setHours(hh)
      createdDate.setMinutes(mm)
      let newId = dispatch(
        recreateTransaction({
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
        applyChangesToTransaction({
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
            label={`Расход с ${outcomeAccount.title}`}
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
            label={`Доход на ${incomeAccount.title}`}
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
            value={localDate}
            onChange={date => date && setLocalDate(+date)}
            label="Дата"
            cancelText="Отмена"
            okText="Ок"
            mask="__.__.____"
            renderInput={params => (
              <TextField size="small" fullWidth {...params} />
            )}
          />
          <TextField
            value={localTime}
            onChange={e => setLocalTime(e.target.value)}
            type="time"
            label="Время"
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
          value={localPayee || ''}
          onChange={e => setLocalPayee(e.target.value)}
          label="Место платежа"
          multiline
          maxRows="4"
          fullWidth
          helperText=""
          size="small"
        />
        <TextField
          value={localComment || ''}
          onChange={e => setLocalComment(e.target.value)}
          label="Комментарий"
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
            Операция создана – {formatDate(created, 'dd MMM yyyy, HH:mm')}
          </span>
          <span>
            Операция изменена – {formatDate(changed, 'dd MMM yyyy, HH:mm')}
          </span>
          <RateToWords tr={tr} />
        </Stack>

        <Button onClick={() => onSelectSimilar(changed)}>
          Другие из этой синхронизации
        </Button>
      </Stack>

      <SaveButton visible={hasChanges} onSave={onSave} />
    </Box>
  )
}

const titles = {
  income: 'Доход',
  outcome: 'Расход',
  transfer: 'Перевод',
  incomeDebt: 'Долг',
  outcomeDebt: 'Долг',
}

type HeadProps = {
  title: string
  deleted: boolean
  onClose: () => void
  onDelete: () => void
  onDeletePermanently: () => void
  onRestore: () => void
}
const Head: FC<HeadProps> = ({
  title,
  deleted,
  onClose,
  onDelete,
  onDeletePermanently,
  onRestore,
}) => (
  <Box py={1} px={3} display="flex" alignItems="center">
    <Box flexGrow={1}>
      {deleted && (
        <Typography variant="caption" color="error" noWrap>
          Операция удалена
        </Typography>
      )}
      <Typography variant="h6" noWrap>
        {title}
      </Typography>
    </Box>

    {deleted ? (
      <Tooltip title="Восстановить">
        <IconButton onClick={onRestore} children={<RestoreFromTrashIcon />} />
      </Tooltip>
    ) : (
      <Tooltip title="Удалить">
        <IconButton
          onClick={e => (e.shiftKey ? onDeletePermanently() : onDelete())}
          children={<DeleteIcon />}
        />
      </Tooltip>
    )}

    <Tooltip title="Закрыть">
      <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
    </Tooltip>
  </Box>
)

const SaveButton: FC<{ visible: boolean; onSave: () => void }> = ({
  visible,
  onSave,
}) => (
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
        Сохранить
      </Fab>
    </Zoom>
  </Box>
)

const RateToWords: FC<{ tr: Transaction }> = ({ tr }) => {
  const trType = getType(tr)
  const { income, opIncome, outcome, opOutcome } = tr
  const instruments = useSelector(getInstruments)
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
    return <span>Курс – {rate}</span>
  }
  return null
}
