import React, { FC, useState } from 'react'
import { Box, Paper, Typography, Collapse, Link, BoxProps } from '@mui/material'
import QRCode from 'qrcode.react'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney } from '6-shared/helpers/money'
import { formatDate } from '6-shared/helpers/date'
import { parseReceipt } from '6-shared/helpers/receipt'

interface RecieptProps {
  value?: string | null
  sx?: BoxProps['sx']
}

export const Reciept: FC<RecieptProps> = ({ value, sx }) => {
  const [showMore, setShowMore] = useState(false)
  const theme = useAppTheme()
  if (!value) return null

  const parsed = parseReceipt(value)

  return (
    <Paper sx={{ p: 2, display: 'flex', ...sx }}>
      <Box display="flex" flexDirection="column">
        <Line name="Сумма" value={formatMoney(parsed.s, 'RUB')} />
        <Line name="Дата" value={formatDate(parsed.t, 'dd.MM.yyyy, HH:mm')} />

        <Box mt="auto">
          <Collapse in={!showMore} unmountOnExit>
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

        <Collapse in={showMore} unmountOnExit>
          <div>
            <Line name="ФН" value={parsed.fn} />
            <Line name="ФД" value={parsed.i} />
            <Line name="ФП" value={parsed.fp} />
          </div>
        </Collapse>
      </Box>

      <Box ml="auto">
        <QRCode
          value={value}
          bgColor={theme.palette.background.paper}
          fgColor={theme.palette.text.primary}
          includeMargin
        />
      </Box>
    </Paper>
  )
}

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
