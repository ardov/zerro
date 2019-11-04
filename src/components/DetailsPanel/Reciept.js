import React from 'react'
import { Box, Tooltip, IconButton } from '@material-ui/core'
import QRCode from 'qrcode.react'
import ReceiptIcon from '@material-ui/icons/Receipt'

export default function Reciept({ value, ...rest }) {
  return value ? (
    <Tooltip
      interactive
      placement="top"
      title={
        <Box display="flex" alignItems="center" flexDirection="column">
          <QRCode value={value} />
          <Box mt={1} maxWidth={160} textAlign="center">
            {value}
          </Box>
        </Box>
      }
    >
      <IconButton children={<ReceiptIcon />} {...rest} />
    </Tooltip>
  ) : null
}
