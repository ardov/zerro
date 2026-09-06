import type { TFxCode } from '@/6-shared/types'
import { formatMoney } from '@/6-shared/helpers/money'
import type { MouseEvent } from 'react'
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
  className?: string
  'aria-label'?: string
}

/** The amount as the headline of a form rather than a field in it.
 *
 * It has no frame. What makes it look editable is that it is the largest
 * thing on the surface and the caret lands in it — so the whole amount is
 * selected on focus and typing replaces it. The arithmetic every amount field
 * takes works here too.
 *
 * The whole line is the target, not the digits. The input itself is only as
 * wide as its text — that is what keeps the amount optically centred and the
 * currency code against it — so the row hands the click on: anywhere along it
 * focuses the amount, which selects it. Nobody has to hit a four-character
 * number to start typing over it. */
export function BigAmountInput({
  value,
  onChange,
  onEnter,
  currency,
  sign,
  autoFocus,
  disabled,
  className,
  'aria-label': ariaLabel,
}: BigAmountInputProps) {
  const { inputProps } = useAmountExpression({
    value,
    onChange,
    onEnter,
    // No trailing zeroes on a whole amount: the headline is read far more
    // often than it is edited, and `3 240` reads faster than `3 240,00`.
    format: amount => formatMoney(amount, null, 'ifAny'),
  })

  const focusAmount = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    if ((event.target as HTMLElement).closest('input')) return
    const input = event.currentTarget.querySelector('input')
    if (!input) return
    // The row is not the control, so the press would otherwise take the focus
    // straight back off it.
    event.preventDefault()
    input.focus()
  }

  return (
    <div
      onMouseDown={focusAmount}
      className={cn(
        'flex cursor-text flex-wrap items-baseline justify-center text-[2.125rem] leading-[1.235] font-bold',
        disabled && 'text-disabled-foreground',
        className
      )}
    >
      {sign && (
        <span aria-hidden className="shrink-0">
          {sign}
        </span>
      )}
      <AutoWidthInput
        {...inputProps}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={ariaLabel}
        className="max-w-full justify-items-center"
        inputClassName="text-center"
      />
      {currency && (
        <span className="ml-2 shrink-0 type-body text-muted-foreground">
          {currency}
        </span>
      )}
    </div>
  )
}
