import React, { useState } from 'react'
import TagSelect from 'components/TagSelect'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FormattedNumber } from 'react-intl'
import Reciept from './Reciept'
import {
  Button,
  Box,
  Typography,
  Drawer,
  IconButton,
  TextField,
  Fab,
  Zoom,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/Delete'
import { DatePicker } from '@material-ui/pickers'
import { withStyles } from '@material-ui/styles'

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
  incomeInstrument, //: instruments[raw.incomeInstrument],
  incomeAccount, //: accounts[raw.incomeAccount],
  opIncome,
  opIncomeInstrument, //: instruments[raw.opIncomeInstrument],
  incomeBankID,
  outcome,
  outcomeInstrument, //: instruments[raw.outcomeInstrument],
  outcomeAccount, //: accounts[raw.outcomeAccount],
  opOutcome, //: raw.opOutcome,
  opOutcomeInstrument, //: instruments[raw.opOutcomeInstrument],
  outcomeBankID, //: raw.outcomeBankID,
  tag, //: mapTags(raw.tag, tags),
  comment, //: raw.comment,
  payee, //: raw.payee,
  originalPayee, //: raw.originalPayee,
  merchant, //: merchants[raw.merchant],
  latitude, //: raw.latitude,
  longitude, //: raw.longitude,
  reminderMarker, //: raw.reminderMarker,
  type,

  anchor = 'right',
  open,
  variant,
  onClose,
  onSave,
  ...rest
}) {
  const [localComment, setLocalComment] = useState(comment)
  const [localPayee, setLocalPayee] = useState(payee)
  const [localDate, setLocalDate] = useState(date)

  const hasChanges = comment !== localComment || payee !== localPayee
  return (
    <Drawer {...{ anchor, open, variant, onClose }}>
      <Box minWidth={320} position="relative">
        <Head title={titles[type]} onClose={onClose} />
        <Box p={3} bgcolor="background.default">
          123
        </Box>
        <Box px={3}>
          <Box mt={3}>
            <TextField
              value={localComment}
              onChange={e => setLocalComment(e.target.value)}
              label="Комментарий"
              multiline
              rowsMax="4"
              fullWidth
              helperText=""
              variant="outlined"
            />
          </Box>

          <Box mt={3}>
            <TextField
              value={localPayee}
              onChange={e => setLocalPayee(e.target.value)}
              label="Плательщик"
              multiline
              rowsMax="4"
              fullWidth
              helperText=""
              variant="outlined"
            />
          </Box>

          <Box mt={3}>
            <DatePicker
              value={localDate}
              onChange={date => setLocalDate(date)}
              label="Дата"
              fullWidth
              autoOk
              cancelLabel="Отмена"
              okLabel="Ок"
              format="dd MMMM yyyy, EEEEEE"
              variant="dialog"
              inputVariant="outlined"
            />
          </Box>
          <Reciept mt={2} value={qrCode} />
        </Box>

        <SaveButton visible={hasChanges} />
      </Box>
    </Drawer>
  )
}

const titles = {
  income: 'Доход',
  outcome: 'Расход',
  transfer: 'Перевод',
}

const Head = ({ title, onClose, onDelete }) => (
  <Box py={1} px={3} display="flex" alignItems="center">
    <Box flexGrow={1}>
      <Typography variant="h6" noWrap>
        {title}
      </Typography>
    </Box>
    <IconButton onClick={onDelete} children={<DeleteIcon />} />
    <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
  </Box>
)

const SaveButton = ({ visible, onSave }) => (
  <Box
    mt={4}
    zIndex={2}
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
