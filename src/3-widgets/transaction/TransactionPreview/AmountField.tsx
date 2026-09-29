import { useId, useRef, type ReactNode } from 'react'
import type { TFxCode } from '@/6-shared/types'
import { AmountInlineField } from '@/6-shared/ui/kit/AmountInput'
import { FieldSurface, FieldAddon, FieldMessage } from '@/6-shared/ui/kit/Field'

export type AmountFieldProps = {
  value: number
  onChange: (value: number) => void
  currency?: TFxCode | null
  icon: ReactNode
  label: string
  invalid?: boolean
  error?: ReactNode
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

/** The currency stays beside the amount, with the shared field's validation. */
export function AmountField(props: AmountFieldProps) {
  const {
    currency,
    icon,
    className,
    invalid,
    error,
    disabled,
    readOnly,
    ...restProps
  } = props
  const controlRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  return (
    <div>
      <FieldSurface
        controlRef={controlRef}
        className={className}
        invalid={invalid}
        disabled={disabled}
        readOnly={readOnly}
        start={<FieldAddon kind="icon">{icon}</FieldAddon>}
      >
        <AmountInlineField
          {...restProps}
          ref={controlRef}
          invalid={invalid || undefined}
          disabled={disabled}
          readOnly={readOnly}
          aria-describedby={error ? errorId : undefined}
          end={
            currency && <span className="text-ui-secondary">{currency}</span>
          }
          className="py-3"
        />
      </FieldSurface>
      {error && (
        <FieldMessage id={errorId} error>
          {error}
        </FieldMessage>
      )}
    </div>
  )
}
