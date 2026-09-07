import type { FC, ReactNode } from 'react'
import type { TFxCode } from '@/6-shared/types'
import { formatMoney } from '@/6-shared/helpers/money'
import { AutoWidthInput } from '@/6-shared/ui/AutoWidthInput'
import type { FilledFieldState } from '@/6-shared/ui/FilledField'
import { FilledField } from '@/6-shared/ui/FilledField'
import { useAmountExpression } from '@/6-shared/ui/useAmountExpression'

export type AmountFieldProps = FilledFieldState & {
  value: number
  onChange: (value: number) => void
  currency?: TFxCode | null
  icon: ReactNode
  label: string
  className?: string
}

/** One leg of a transfer: what it is worth, in the currency of the account
 * above it. The currency sits right against the number rather than at the far
 * end of the row, because the two are one reading. */
export const AmountField: FC<AmountFieldProps> = ({
  value,
  onChange,
  currency,
  icon,
  label,
  className,
  ...state
}) => {
  const { inputProps } = useAmountExpression({
    value,
    onChange,
    format: amount => formatMoney(amount, null, 'ifAny'),
  })
  return (
    <FilledField {...state} icon={icon} className={className}>
      <AutoWidthInput {...inputProps} aria-label={label} className="shrink" />
      {currency && (
        <span className="shrink-0 text-muted-foreground">{currency}</span>
      )}
    </FilledField>
  )
}
