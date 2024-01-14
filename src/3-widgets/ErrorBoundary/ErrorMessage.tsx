import React, { FC } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { SyncIcon } from '6-shared/ui/Icons'
import { useTranslation } from 'react-i18next'

interface ErrorMessageProps {
  onLogOut: () => void
  message: string
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ onLogOut, message }) => {
  const { t } = useTranslation('errorBoudary')
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="inherit"
    >
      <Box p={5} mx="auto" maxWidth={500}>
        <Typography variant="h4" paragraph>
          {t('title')}
        </Typography>

        <Typography variant="body1" paragraph>
          {t('description')}
        </Typography>

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={() => window.location.reload()}
          >
            {t('btnRefresh')}
          </Button>

          <Button onClick={onLogOut} sx={{ ml: 2 }}>
            {t('btnLogOut')}
          </Button>

          {!!message && (
            <Typography
              sx={{ mt: 6, color: 'text.secondary' }}
              variant="body1"
              paragraph
            >
              {t('errorMsg', { message })}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}
