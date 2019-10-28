import React, { useState } from 'react'
import { Box, Paper, Typography, Collapse, Link } from '@material-ui/core'
import parse from 'date-fns/parseISO'
import QRCode from 'qrcode.react'
import { formatMoney } from 'helpers/format'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

const formatDate = date => format(date, 'dd.MM.yyyy, HH:mm', { locale: ru })

export default function Reciept({ value, ...rest }) {
  const [showMore, setShowMore] = useState(false)
  if (!value) return null

  const parsed = parseReceipt(value)
  parsed.t = parse(parsed.t)

  return (
    <Box p={2} display="flex" {...rest} clone>
      <Paper>
        <Box display="flex" flexDirection="column">
          <Line name="Сумма" value={formatMoney(parsed.s, 'RUB')} />
          <Line name="Дата" value={formatDate(parsed.t)} />

          <Box mt="auto">
            <Collapse in={!showMore}>
              <Link
                component="button"
                variant="caption"
                color="primary"
                onClick={() => setShowMore(true)}
              >
                Показать больше
              </Link>
            </Collapse>
          </Box>

          <Collapse in={showMore}>
            <div>
              <Line name="ФН" value={parsed.fn} />
              <Line name="ФД" value={parsed.i} />
              <Line name="ФП" value={parsed.fp} />
            </div>
          </Collapse>
        </Box>

        <Box ml="auto" clone>
          <QRCode value={value} />
        </Box>
      </Paper>
    </Box>
  )
}

const parseReceipt = string =>
  string.split('&').reduce((obj, str) => {
    const arr = str.split('=')
    obj[arr[0]] = arr[1]
    return obj
  }, {})

const Line = ({ name, value }) => (
  <Box mb={1}>
    <Typography variant="caption" color="textSecondary" display="block">
      {name}
    </Typography>
    <Typography variant="body1" display="block">
      {value}
    </Typography>
  </Box>
)
