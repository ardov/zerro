import React, { FC, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Collapse,
  Link,
  BoxProps,
} from '@material-ui/core'
import parse from 'date-fns/parseISO'
import QRCode from 'qrcode.react'
import { formatMoney, formatDate } from 'helpers/format'

interface RecieptProps extends BoxProps {
  value?: string
}

export const Reciept: FC<RecieptProps> = ({ value, ...rest }) => {
  const [showMore, setShowMore] = useState(false)
  if (!value) return null

  const parsed = parseReceipt(value)
  parsed.t = parse(parsed.t)

  return (
    <Box p={2} display="flex" {...rest} clone>
      <Paper>
        <Box display="flex" flexDirection="column">
          <Line name="Сумма" value={formatMoney(parsed.s, 'RUB')} />
          <Line name="Дата" value={formatDate(parsed.t, 'dd.MM.yyyy, HH:mm')} />

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

interface RecieptData {
  t: string
  i: string
  fn: string
  fp: string
}

const parseReceipt = (string: string) =>
  string.split('&').reduce((obj: any, str) => {
    const arr = str.split('=')
    obj[arr[0]] = arr[1]
    return obj as RecieptData
  }, {})

interface LineProps {
  name: string
  value: string
}

const Line: FC<LineProps> = ({ name, value }) => (
  <Box mb={1}>
    <Typography variant="caption" color="textSecondary" display="block">
      {name}
    </Typography>
    <Typography variant="body1" display="block">
      {value}
    </Typography>
  </Box>
)
