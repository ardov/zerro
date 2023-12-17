import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('reciept')
  const [showMore, setShowMore] = useState(false)
  const theme = useAppTheme()
  if (!value) return null

  const parsed = parseReceipt(value)

  return (
    <Paper sx={{ p: 2, display: 'flex', ...sx }}>
      <Box display="flex" flexDirection="column">
        <Line name={t('sum')} value={formatMoney(parsed.s, 'RUB')} />
        <Line
          name={t('date')}
          value={formatDate(parsed.t, 'dd.MM.yyyy, HH:mm')}
        />

        <Box mt="auto">
          <Collapse in={!showMore} unmountOnExit>
            <Link
              component="button"
              variant="caption"
              color="primary"
              onClick={() => setShowMore(true)}
            >
              {t('showMore', { ns: 'common' })}
            </Link>
          </Collapse>
        </Box>

        <Collapse in={showMore} unmountOnExit>
          <div>
            <Line name={t('fn')} value={parsed.fn} />
            <Line name={t('i')} value={parsed.i} />
            <Line name={t('fp')} value={parsed.fp} />
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
