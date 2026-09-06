import { Toast } from '@base-ui/react/toast'
import { IconButton } from './Button'
import type { FC } from 'react'
import React, { useCallback, useContext } from 'react'
import { CloseIcon } from './Icons'

export type TSnackBarProps = {
  message: string
  autoHideDuration?: number
}

const SnackbarContext = React.createContext<(msg: TSnackBarProps) => void>(
  () => {}
)

export const useSnackbar = () => useContext(SnackbarContext)

export const SnackbarProvider: FC<{ children: React.ReactNode }> = props => (
  <Toast.Provider timeout={6000} limit={1}>
    <SnackbarContents>{props.children}</SnackbarContents>
  </Toast.Provider>
)

function SnackbarContents({ children }: { children: React.ReactNode }) {
  const { add, close, toasts } = Toast.useToastManager()
  const setMessage = useCallback(
    (msg: TSnackBarProps) => {
      add({
        id: 'application-snackbar',
        description: msg.message,
        timeout: msg.autoHideDuration ?? 6000,
      })
    },
    [add]
  )
  return (
    <SnackbarContext.Provider value={setMessage}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed top-6 right-6 z-tooltip w-[calc(100vw-48px)] max-w-[568px] outline-none">
          {toasts.map(toast => (
            <Toast.Root
              key={toast.id}
              toast={toast}
              role="status"
              className="relative flex w-full items-center gap-2 rounded-lg bg-tooltip px-4 py-1.5 font-sans text-tooltip-foreground shadow-elevation-6 transition-[opacity,transform] duration-250 ease-in-out data-ending-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:opacity-0"
            >
              <Toast.Content className="min-w-0 flex-1 py-1">
                <Toast.Description className="m-0 type-body-sm" />
              </Toast.Content>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => close(toast.id)}
              >
                <CloseIcon size={20} />
              </IconButton>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Portal>
    </SnackbarContext.Provider>
  )
}
