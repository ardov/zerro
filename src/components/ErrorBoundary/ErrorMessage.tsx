import React, { FC } from 'react'
import { Box, Typography, Button } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Refresh'

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
          onClick={() => window.location.reload(true)}
        >
          Обновить
        </Button>
        <Box ml={2} clone>
          <Button onClick={onLogOut}>Выйти</Button>
        </Box>
      </Box>
    </Box>
  </Box>
)
