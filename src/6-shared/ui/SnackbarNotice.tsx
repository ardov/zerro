import { Toast } from '@base-ui/react/toast'
import type { ReactNode } from 'react'
import { useEffect, useId } from 'react'
import { cn } from './shadcn/utils'

type SnackbarNoticeProps = {
  children: ReactNode
  title?: ReactNode
  action?: ReactNode
  severity: 'error' | 'info' | 'warning'
  position?: 'bottom-center' | 'top-center'
}

/** A Redux-controlled alert that uses the same Base UI toast primitive as the
 * transient snackbar. It owns a one-toast provider so a conditional notice can
 * keep its normal component lifecycle instead of mirroring Redux state into a
 * global queue. */
export function SnackbarNotice(props: SnackbarNoticeProps) {
  return (
    <Toast.Provider timeout={0} limit={1}>
      <SnackbarNoticeContents {...props} />
    </Toast.Provider>
  )
}

function SnackbarNoticeContents(props: SnackbarNoticeProps) {
  const { add, toasts } = Toast.useToastManager()
  const id = useId()

  useEffect(() => {
    add({
      id,
      timeout: 0,
      priority: 'low',
      title: props.title,
    })
  }, [add, id, props.title])

  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cn(
          'fixed right-6 left-6 z-tooltip mx-auto w-auto max-w-[600px] outline-none',
          props.position === 'bottom-center' ? 'bottom-6' : 'top-6'
        )}
      >
        {toasts.map(toast => (
            <Toast.Root
              key={toast.id}
              toast={toast}
              role="alert"
              swipeDirection={[]}
              className={cn(
                'relative w-full rounded-lg px-4 py-3 font-sans shadow-elevation-6 transition-[opacity,transform] duration-250 ease-in-out data-ending-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:opacity-0',
                props.severity === 'error' && 'bg-error text-error-foreground',
                props.severity === 'warning' &&
                  'bg-warning text-warning-foreground',
                props.severity === 'info' && 'bg-info text-info-foreground'
              )}
            >
              <Toast.Content className="flex items-start gap-3">
                <div className="min-w-0 flex-1 type-body-sm">
                  {props.title && (
                    <Toast.Title className="m-0 mb-1 type-body font-medium" />
                  )}
                  {props.children}
                </div>
                {props.action && (
                  <div className="flex shrink-0 items-center gap-1">
                    {props.action}
                  </div>
                )}
              </Toast.Content>
            </Toast.Root>
          ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
