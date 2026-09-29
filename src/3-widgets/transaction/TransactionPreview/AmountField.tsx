import { useRef, type ReactNode } from 'react'
import type { TFxCode } from '@/6-shared/types'
import { AmountInlineField } from '@/6-shared/ui/kit/AmountInput'
import { FieldSurface, FieldAddon } from '@/6-shared/ui/kit/Field'

export type AmountFieldProps = {
  value: number
  onChange: (value: number) => void
  currency?: TFxCode | null
  icon: ReactNode
  label: string
  invalid?: boolean
  className?: string
}

/** The currency stays beside the amount, with the shared field's validation. */
export function AmountField(props: AmountFieldProps) {
  const { currency, icon, className, invalid, ...restProps } = props
  const controlRef = useRef<HTMLInputElement>(null)
  return (
    <FieldSurface
      controlRef={controlRef}
      className={className}
      invalid={invalid}
      start={<FieldAddon kind="icon">{icon}</FieldAddon>}
    >
      <AmountInlineField
        {...restProps}
        ref={controlRef}
        invalid={invalid}
        end={currency && <span className="text-ui-secondary">{currency}</span>}
        className="py-3"
      />
    </FieldSurface>
  )
}
