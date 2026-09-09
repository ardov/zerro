import type { FC } from 'react'
import { Button } from './Button'
import { OutlinedField, type OutlinedFieldProps } from './OutlinedField'
import { formatMoney, getCurrencySymbol } from '@/6-shared/helpers/money'
import type { Modify } from '@/6-shared/types'
import { useAmountExpression } from './useAmountExpression'

// `ref` and `type` are owned: the ref drives selectOnFocus and the sign
// buttons, and `tel` is what raises the numeric keypad on mobile.
type TFieldProps = Omit<OutlinedFieldProps, 'ref' | 'type'>

export type AmountInputProps = Modify<
  TFieldProps,
  {
    value: number
    currency?: string
    selectOnFocus?: boolean
    signButtons?: boolean | 'auto'
    onChange: (n: number) => void
    onEnter?: (n: number) => void
  }
>

export const AmountInput: FC<AmountInputProps> = ({
  value = 0,
  currency,
  selectOnFocus = false,
  signButtons,
  onChange,
  onEnter,
  onBlur,
  onFocus,
  onBeforeInput,
  onKeyDown,
  autoFocus,
  endAdornment,
  ...rest
}) => {
  const sym = currency ? getCurrencySymbol(currency) : null
  const { inputProps, appendOperator } = useAmountExpression({
    value,
    onChange,
    onEnter,
    format: amount => formatMoney(amount, null, 2),
    selectOnFocus,
    onFocus,
    onBlur,
    onBeforeInput,
    onKeyDown,
  })

  const Field = (
    <OutlinedField
      {...inputProps}
      autoFocus={autoFocus}
      endAdornment={endAdornment === undefined ? sym : endAdornment}
      {...rest}
    />
  )

  if (!signButtons) {
    return Field
  }
  if (signButtons === 'auto' && !iOS()) {
    return Field
  }
  return (
    <div>
      {Field}
      <div className="flex w-full">
        <Button onClick={() => appendOperator('+')}>+</Button>
        <Button onClick={() => appendOperator('-')}>-</Button>
        <Button onClick={() => appendOperator('*')}>×</Button>
        <Button onClick={() => appendOperator('/')}>÷</Button>
      </div>
    </div>
  )
}

function iOS() {
  return (
    [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}
