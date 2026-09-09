import type { TFxCode } from '@/6-shared/types'
import { formatMoney } from '@/6-shared/helpers/money'
import type { Ref } from 'react'
import { AutoWidthInput } from './AutoWidthInput'
import { cn } from './shadcn/utils'
import { useAmountExpression } from './useAmountExpression'

export type BigAmountInputProps = {
  value: number
  onChange: (value: number) => void
  onEnter?: (value: number) => void
  currency?: TFxCode | null
  /** Which way the money goes. Shown, not typed: the field holds a size, and
   * the direction belongs to the transaction's type rather than the amount. */
  sign?: '+' | '−' | null
  autoFocus?: boolean
  disabled?: boolean
  /** Marked wrong. The headline has no frame to hang a mark off, so the
   * amount itself turns red. */
  invalid?: boolean
  /** The line itself, for a caller that has to move it — a refused save
   * shakes the headline. */
  ref?: Ref<HTMLLabelElement>
  className?: string
  'aria-label'?: string
}

export function BigAmountInput({
  value,
  onChange,
  onEnter,
  currency,
  sign,
  autoFocus,
  disabled,
  invalid,
  ref,
  className,
  'aria-label': ariaLabel,
}: BigAmountInputProps) {
  const { inputProps } = useAmountExpression({
    value,
    onChange,
    onEnter,
    format: amount => formatMoney(amount, null, 'ifAny'),
  })
  const empty = inputProps.value === ''

  return (
    <label
      ref={ref}
      // onMouseDown={focusAmount}
      className={cn(
        'flex cursor-text flex-wrap items-baseline justify-center text-4xl font-bold',
        disabled && 'text-disabled-foreground',
        invalid && 'text-error',
        className
      )}
    >
      {sign && (
        <span
          aria-hidden
          className={cn('shrink-0', empty && 'text-disabled-foreground')}
        >
          {sign}
        </span>
      )}
      <AutoWidthInput
        {...inputProps}
        placeholder="0"
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={ariaLabel}
        className="max-w-full"
        inputClassName={cn(
          'text-center',
          // TODO: add opacities to the system
          'placeholder:text-current placeholder:opacity-42 dark:placeholder:opacity-50'
        )}
      />
      {currency && (
        <span className="ml-1 shrink-0 text-body font-bold">{currency}</span>
      )}
    </label>
  )
}
