import { Toast as Primitive } from '@base-ui/react/toast'
import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useVisualViewport } from '../useVisualViewport'
import { Button, IconButton } from './Button'
import './Toast.css'

export type ToastType =
  'neutral' | 'success' | 'info' | 'warning' | 'error' | 'loading'
type PrimitiveOptions = Parameters<
  ReturnType<typeof Primitive.createToastManager>['add']
>[0]
export type ToastOptions = Pick<
  PrimitiveOptions,
  | 'id'
  | 'title'
  | 'description'
  | 'timeout'
  | 'priority'
  | 'actionProps'
  | 'onClose'
  | 'onRemove'
> & {
  type?: ToastType
}
export type ToastUpdate = Partial<Omit<ToastOptions, 'id'>>

/** Create an isolated instance for a separate React root or Storybook canvas. */
export function createToastManager() {
  const manager = Primitive.createToastManager()
  // The provider only subscribes; callers get the smaller, typed kit API.
  return manager as Omit<typeof manager, 'add' | 'update' | 'promise'> & {
    add: (options: ToastOptions) => string
    update: (id: string, options: ToastUpdate) => void
  }
}

/** Mount one Toaster before calling this manager. Calls are not persisted. */
export const toast = createToastManager()

export type ToasterProps = {
  /** Defaults to the application-wide manager. Use one renderer per manager. */
  manager?: ReturnType<typeof createToastManager>
}

export function Toaster(props: ToasterProps) {
  const { manager = toast } = props
  return (
    <Primitive.Provider
      toastManager={manager as ReturnType<typeof Primitive.createToastManager>}
      timeout={6000}
      limit={3}
    >
      <ToastViewport />
    </Primitive.Provider>
  )
}

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  loading: LoaderCircle,
}

function ToastViewport() {
  const { toasts } = Primitive.useToastManager()
  const { t } = useTranslation()
  const viewport = useVisualViewport()
  return (
    <Primitive.Portal>
      <div className="kit-toast-screen" style={viewport ?? undefined}>
        <Primitive.Viewport
          aria-label={t('notifications')}
          className="kit-toast-viewport"
        >
          {toasts.map(item => {
            const Icon = icons[item.type as keyof typeof icons]
            return (
              <Primitive.Root
                key={item.id}
                toast={item}
                swipeDirection={['right', 'down']}
                className="kit-toast rounded-smooth focusable"
              >
                <Primitive.Content className="kit-toast-content">
                  {Icon && <Icon aria-hidden className="kit-toast-icon" />}
                  <div className="min-w-0 flex-1">
                    <Primitive.Title className="text-ui-16 font-medium" />
                    <Primitive.Description className="kit-toast-description text-ui-14 text-ui-secondary" />
                    {item.actionProps && (
                      <Primitive.Action
                        render={<Button variant="secondary" size="sm" />}
                        className="kit-toast-action mt-3"
                      />
                    )}
                  </div>
                  <Primitive.Close
                    render={
                      <IconButton
                        label={t('dismissNotification')}
                        tooltip={false}
                        variant="ghost"
                        size="sm"
                      />
                    }
                    className="-my-2 -mr-2"
                  >
                    <X />
                  </Primitive.Close>
                </Primitive.Content>
              </Primitive.Root>
            )
          })}
        </Primitive.Viewport>
      </div>
    </Primitive.Portal>
  )
}
