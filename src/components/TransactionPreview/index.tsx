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
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/Delete'
// import { DatePicker } from '@material-ui/pickers'
import { Map } from './Map'
import AmountInput from 'components/AmountInput'
import { formatDate, rateToWords } from 'helpers/format'
import { TagList } from 'components/TagList'
import { useDispatch, useSelector } from 'react-redux'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import { getPopulatedAccounts } from 'store/localData/accounts'
import { getInstruments } from 'store/data/selectors'
import {
  applyChangesToTransaction,
  deleteTransactions,
  restoreTransaction,
  TransactionPatch,
} from 'store/localData/transactions/thunks'

type TransactionPreviewProps = {
  id: string
  onClose: () => void
  onSelectSimilar: (date: number) => void
}

export const TransactionPreview: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onSelectSimilar } = props
  const dispatch = useDispatch()
  const onChange = (changes: TransactionPatch) =>
    dispatch(applyChangesToTransaction(changes))
  const onDelete = () => dispatch(deleteTransactions([id]))
  const onRestore = () => dispatch(restoreTransaction(id))
  // onSplit: id => dispatch(splitTransfer(id)), // does not work

  const tr = useSelector(getTransactions)[id]
  const trType = getType(tr)
  const incomeAccount = useSelector(getPopulatedAccounts)[tr.incomeAccount]
  const outcomeAccount = useSelector(getPopulatedAccounts)[tr.outcomeAccount]
  const instruments = useSelector(getInstruments)
  const incomeCurrency = instruments[tr.incomeInstrument]?.shortTitle
  const opIncomeCurrency =
    tr.opIncomeInstrument && instruments[tr.opIncomeInstrument]?.shortTitle
  const outcomeCurrency = instruments[tr.outcomeInstrument]?.shortTitle
  const opOutcomeCurrency =
    tr.opOutcomeInstrument && instruments[tr.opOutcomeInstrument]?.shortTitle
  const {
    date,
    changed,
    created,
    deleted,
    qrCode,
    income,
    opIncome,
    outcome,
    opOutcome,
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
  const [localTag, setLocalTag] = useState(tr.tag)

  useEffect(() => {
    setLocalComment(tr.comment)
    setLocalOutcome(tr.outcome)
    setLocalIncome(tr.income)
    setLocalPayee(tr.payee)
    setLocalDate(tr.date)
    setLocalTag(tr.tag)
  }, [tr])

  const hasChanges =
    comment !== localComment ||
    outcome !== localOutcome ||
    income !== localIncome ||
    payee !== localPayee ||
    date !== localDate ||
    localTag !== tag

  const onSave = () =>
    onChange({
      id,
      comment: localComment,
      outcome: localOutcome,
      income: localIncome,
      payee: localPayee,
      date: localDate,
      tag: localTag,
    })

  return (
    <Box minWidth={320} position="relative">
      <Head
        title={titles[trType]}
        onClose={onClose}
        onDelete={onDelete}
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

      <Box px={3}>
        {trType !== 'income' && (
          <Box mt={2}>
            <AmountInput
              label={`Расход с ${outcomeAccount.title}`}
              currency={outcomeCurrency}
              value={localOutcome}
              onChange={setLocalOutcome}
              selectOnFocus
              fullWidth
              margin="dense"
            />
          </Box>
        )}

        {trType !== 'outcome' && (
          <Box mt={2}>
            <AmountInput
              label={`Доход на ${incomeAccount.title}`}
              currency={incomeCurrency}
              value={localIncome}
              onChange={setLocalIncome}
              selectOnFocus
              fullWidth
              margin="dense"
            />
          </Box>
        )}

        {/* TODO!!! */}
        {/* <Box mt={2}>
          <DatePicker
            value={localDate}
            onChange={date => setLocalDate(+date)}
            label="Дата"
            fullWidth
            autoOk
            cancelLabel="Отмена"
            okLabel="Ок"
            format="dd MMMM yyyy, EEEEEE"
            variant="dialog"
            inputVariant="outlined"
            margin="dense"
          />
        </Box> */}

        <TextField
          value={localPayee || ''}
          onChange={e => setLocalPayee(e.target.value)}
          label="Место платежа"
          multiline
          maxRows="4"
          fullWidth
          helperText=""
          variant="outlined"
          margin="dense"
          sx={{ mt: 2 }}
        />

        <TextField
          value={localComment || ''}
          onChange={e => setLocalComment(e.target.value)}
          label="Комментарий"
          multiline
          maxRows="4"
          fullWidth
          helperText=""
          variant="outlined"
          margin="dense"
          sx={{ mt: 2 }}
        />

        <Reciept sx={{ mt: 2 }} value={qrCode} />

        <Map sx={{ mt: 2 }} longitude={longitude} latitude={latitude} />
      </Box>
      <Box p={3}>
        <Typography variant="caption" color="textSecondary">
          Операция создана – {formatDate(created, 'dd MMM yyyy, HH:mm')}
          <br />
          Последнее изменение – {formatDate(changed, 'dd MMM yyyy, HH:mm')}
          <br />
          {trType === 'income' && !!opIncome && opIncomeCurrency && (
            <>
              {rateToWords(income, incomeCurrency, opIncome, opIncomeCurrency)}
              <br />
            </>
          )}
          {trType === 'outcome' && !!opOutcome && opOutcomeCurrency && (
            <>
              {rateToWords(
                outcome,
                outcomeCurrency,
                opOutcome,
                opOutcomeCurrency
              )}
              <br />
            </>
          )}
          {trType === 'transfer' && incomeCurrency !== outcomeCurrency && (
            <>
              {rateToWords(outcome, outcomeCurrency, income, incomeCurrency)}
              <br />
            </>
          )}
        </Typography>
      </Box>
      <Box p={2}>
        <Button onClick={() => onSelectSimilar(changed)}>
          Найти другие из этой синхронизации
        </Button>
      </Box>

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
  onRestore: () => void
}
const Head: FC<HeadProps> = ({
  title,
  deleted,
  onClose,
  onDelete,
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
        <IconButton onClick={onDelete} children={<DeleteIcon />} />
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
