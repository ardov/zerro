import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { createToastManager, Toaster } from './kit/Toast'

export type TSnackBarProps = {
  message: string
  autoHideDuration?: number
}

const SnackbarContext = createContext<(msg: TSnackBarProps) => void>(() => {})
export const useSnackbar = () => useContext(SnackbarContext)

/** Existing message callers share the kit's stacked toast renderer. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(createToastManager)
  const show = useCallback(
    (msg: TSnackBarProps) => {
      manager.add({
        title: msg.message,
        timeout: msg.autoHideDuration,
      })
    },
    [manager]
  )
  return (
    <SnackbarContext.Provider value={show}>
      {children}
      <Toaster manager={manager} />
    </SnackbarContext.Provider>
  )
}
