import React, { useState, useEffect } from 'react'
import Reciept from './Reciept'
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Fab,
  Zoom,
  Link,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/Delete'
import { DatePicker } from '@material-ui/pickers'
import Map from './Map'
import AmountInput from 'components/AmountInput'
import { formatDate } from 'helpers/format'
import { TagList } from 'components/TagList'

export default function DetailsDrawer({
  id,
  // user,
  date,
  changed,
  created,
  deleted,
  hold,
  qrCode,
  income,
  incomeAccountTitle,
  outcomeAccountTitle,
  incomeCurrency,
  outcomeCurrency,
  incomeInstrument, //: instruments[raw.incomeInstrument],
  incomeAccount, //: accounts[raw.incomeAccount],
  opIncome,
  opIncomeInstrument, //: instruments[raw.opIncomeInstrument],
  incomeBankID,
  outcome,
  outcomeInstrument, //: instruments[raw.outcomeInstrument],
  outcomeAccount, //: accounts[raw.outcomeAccount],
  opOutcome,
  opOutcomeInstrument, //: instruments[raw.opOutcomeInstrument],
  outcomeBankID,
  tag, //: mapTags(raw.tag, tags),
  comment,
  payee,
  originalPayee,
  merchant, //: merchants[raw.merchant],
  latitude,
  longitude,
  reminderMarker,
  type,

  onClose,
  onChange,
  onDelete,
  onRestore,
  onSelectSimilar,

  ...rest
}) {
  const [localComment, setLocalComment] = useState(comment)
  const [localOutcome, setLocalOutcome] = useState(outcome)
  const [localIncome, setLocalIncome] = useState(income)
  const [localPayee, setLocalPayee] = useState(payee)
  const [localDate, setLocalDate] = useState(date)
  const [localTag, setLocalTag] = useState(tag)

  useEffect(() => {
    setLocalComment(comment)
    setLocalOutcome(outcome)
    setLocalIncome(income)
    setLocalPayee(payee)
    setLocalDate(date)
    setLocalTag(tag)
  }, [id, changed, comment, outcome, income, payee, date, tag])

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
        title={titles[type]}
        onClose={onClose}
        onDelete={onDelete}
        onRestore={onRestore}
        deleted={deleted}
      />

      {type !== 'transfer' && (
        <TagList
          tags={localTag}
          onChange={setLocalTag}
          tagType={type}
          px={3}
          py={2}
          bgcolor="background.default"
        />
      )}

      <Box px={3}>
        {type !== 'income' && (
          <Box mt={2}>
            <AmountInput
              label={`Расход с ${outcomeAccountTitle}`}
              currency={outcomeCurrency}
              value={localOutcome}
              onChange={setLocalOutcome}
              fullWidth
              margin="dense"
            />
          </Box>
        )}

        {type !== 'outcome' && (
          <Box mt={2}>
            <AmountInput
              label={`Доход на ${incomeAccountTitle}`}
              currency={incomeCurrency}
              value={localIncome}
              onChange={setLocalIncome}
              fullWidth
              margin="dense"
            />
          </Box>
        )}

        <Box mt={2}>
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
        </Box>

        <Box mt={2}>
          <TextField
            value={localPayee || ''}
            onChange={e => setLocalPayee(e.target.value)}
            label="Место платежа"
            multiline
            rowsMax="4"
            fullWidth
            helperText=""
            variant="outlined"
            margin="dense"
          />
        </Box>

        <Box mt={2}>
          <TextField
            value={localComment || ''}
            onChange={e => setLocalComment(e.target.value)}
            label="Комментарий"
            multiline
            rowsMax="4"
            fullWidth
            helperText=""
            variant="outlined"
            margin="dense"
          />
        </Box>

        <Reciept mt={2} value={qrCode} />

        <Map mt={2} longitude={longitude} latitude={latitude} />
      </Box>
      <Box p={3}>
        <Typography variant="caption" color="textSecondary">
          Операция создана &ndash; {formatDate(created, 'dd MMM yyyy, HH:mm')}
          <br />
          Последнее изменение &ndash;{' '}
          {formatDate(changed, 'dd MMM yyyy, HH:mm')}
          <br />
          <Link
            component="button"
            color="secondary"
            onClick={() => onSelectSimilar(changed)}
          >
            Выделить операции, изменённые в это же время
          </Link>
        </Typography>
      </Box>

      <SaveButton visible={hasChanges} onSave={onSave} />
    </Box>
  )
}

const titles = {
  income: 'Доход',
  outcome: 'Расход',
  transfer: 'Перевод',
}

const Head = ({ title, onClose, onDelete, onRestore, deleted }) => (
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

const SaveButton = ({ visible, onSave }) => (
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
