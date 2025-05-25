import React, { FC, useCallback, useContext, useState } from 'react'
import { IconButton, Slide, SlideProps, Snackbar } from '@mui/material'
import { useCachedValue } from '6-shared/hooks/useCachedValue'
import { CloseIcon } from './Icons'

export type TSnackBarProps = {
  message: string
  autoHideDuration?: number
}

const SnackbarContext = React.createContext<(msg: TSnackBarProps) => void>(
  () => {}
)

export const useSnackbar = () => useContext(SnackbarContext)

export const SnackbarProvider: FC<{ children: React.ReactNode }> = props => {
  const [msg, setMsg] = useState<TSnackBarProps | null>(null)
  const onClose = useCallback(() => setMsg(null), [])
  const isOpened = Boolean(msg)
  const cached = useCachedValue(msg, isOpened)

  const setMessage = useCallback((msg: TSnackBarProps) => {
    setMsg(msg)
  }, [])

  return (
    <SnackbarContext.Provider value={setMessage}>
      {props.children}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isOpened}
        onClose={onClose}
        autoHideDuration={cached?.autoHideDuration || 6000}
        message={cached?.message || ''}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        slots={{
          transition: TransitionLeft,
        }}
      />
    </SnackbarContext.Provider>
  )
}

function TransitionLeft(props: SlideProps) {
  return <Slide {...props} direction="down" />
}
