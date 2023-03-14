import React, { FC } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { SyncIcon } from '@shared/ui/Icons'

interface ErrorMessageProps {
  onLogOut: () => void
  message: string
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ onLogOut, message }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="inherit"
  >
    <Box p={5} mx="auto" maxWidth={500}>
      <Typography variant="h4" paragraph>
        Что-то навернулось 👻
      </Typography>

      <Typography variant="body1" paragraph>
        Обновите страницу, а если это не поможет, попробуйте выйти и зайти
        заново.
      </Typography>

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SyncIcon />}
          onClick={() => window.location.reload()}
        >
          Обновить
        </Button>

        <Button onClick={onLogOut} sx={{ ml: 2 }}>
          Выйти
        </Button>

        {!!message && (
          <Typography
            sx={{ mt: 6, color: 'text.secondary' }}
            variant="body1"
            paragraph
          >
            Орёт на програмистском: {message} !1!!
          </Typography>
        )}
      </Box>
    </Box>
  </Box>
)
