import React, { FC } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { RefreshIcon } from '@shared/ui/Icons'

interface ErrorMessageProps {
  onLogOut: () => void
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ onLogOut }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="inherit"
  >
    <Box p={5} mx="auto" maxWidth={500}>
      <Typography variant="h4" paragraph>
        Что-то навернулось
      </Typography>

      <Typography variant="body1" paragraph>
        Обновите страницу, а если это не поможет, попробуйте выйти и зайти
        заново.
      </Typography>

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Обновить
        </Button>

        <Button onClick={onLogOut} sx={{ ml: 2 }}>
          Выйти
        </Button>
      </Box>
    </Box>
  </Box>
)
