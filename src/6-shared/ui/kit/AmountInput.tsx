import { useImperativeHandle } from 'react'
import { formatMoney } from '@/6-shared/helpers/money/format'
import { useAmountExpression } from './useAmountExpression'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Button } from './Button'
import { InlineField, type InlineFieldProps } from './InlineField'
import { Input, type InputProps } from './Input'

type AmountEditingProps = {
  value: number
  onChange: (value: number) => void
  /** Finishes the expression before handing its amount to the form. */
  onEnter?: (value: number) => void
  selectOnFocus?: boolean
  /** Resting precision only. Typing never pads or truncates the fraction. */
  fractionDigits?: 2 | 'auto'
  /** Shows buttons for arithmetic on keyboards without operator keys. */
  operators?: boolean
}

export type AmountInputProps = Omit<
  InputProps,
  | keyof AmountEditingProps
  | 'onValueChange'
  | 'defaultValue'
  | 'type'
  | 'inputMode'
  | 'min'
  | 'max'
  | 'step'
> &
  AmountEditingProps

export type AmountInlineFieldProps = Omit<
  InlineFieldProps,
  | keyof AmountEditingProps
  | 'onValueChange'
  | 'inputMode'
  | 'min'
  | 'max'
  | 'step'
> &
  AmountEditingProps

/** A numeric value with an editable, live-formatted arithmetic expression. */
export function AmountInput(props: AmountInputProps) {
  const { fractionDigits = 2, ...restProps } = props
  return (
    <AmountEditor
      {...restProps}
      fractionDigits={fractionDigits}
      presentation="field"
    />
  )
}

/** An amount that inherits typography and grows with its text. Start/end
 * content sits next to the amount, including in a transaction headline. */
export function AmountInlineField(props: AmountInlineFieldProps) {
  const { fractionDigits = 'auto', ...restProps } = props
  return (
    <AmountEditor
      {...restProps}
      fractionDigits={fractionDigits}
      presentation="inline"
    />
  )
}

const operators = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
] as const

/** Both presentations share one editing session, including focus moving
 * between the input, its addons and the optional operator buttons. */
function AmountEditor(
  props: AmountInputProps & { presentation: 'field' | 'inline' }
) {
  const {
    value,
    onChange,
    onEnter,
    selectOnFocus = false,
    fractionDigits,
    operators: showOperators,
    presentation,
    ref,
    className,
    style,
    size,
    labelMode,
    error,
    description,
    controlClassName,
    controlStyle,
    onFocus,
    onBlur,
    onBeforeInput,
    onKeyDown,
    onSelect,
    disabled,
    readOnly,
    placeholder = '0',
    ...restProps
  } = props
  const { inputProps, editorProps, insertOperator } = useAmountExpression({
    value,
    onChange,
    onEnter,
    selectOnFocus,
    format: amount =>
      formatMoney(amount, null, fractionDigits === 'auto' ? 'ifAny' : 2),
    onFocus,
    onBlur,
    onBeforeInput,
    onKeyDown,
  })
  useImperativeHandle(ref, () => inputProps.ref.current!)
  const controlProps: InputProps = {
    ...restProps,
    ...inputProps,
    disabled,
    readOnly,
    placeholder,
    onSelect: event => {
      inputProps.onSelect(event)
      onSelect?.(event)
    },
  }

  return (
    <div
      {...editorProps}
      className={cn(
        presentation === 'inline' &&
          'inline-block min-w-0 max-w-full align-baseline',
        className
      )}
      style={style}
    >
      {presentation === 'field' ? (
        <Input
          {...controlProps}
          size={size}
          labelMode={labelMode}
          error={error}
          description={description}
          controlClassName={controlClassName}
          controlStyle={controlStyle}
        />
      ) : (
        <InlineField {...controlProps} value={inputProps.value} />
      )}
      {showOperators && (
        <div className="mt-1 flex gap-1">
          {operators.map(operator => (
            <Button
              key={operator.value}
              type="button"
              variant="ghost"
              size="sm"
              className="min-w-0 flex-1 px-0"
              disabled={disabled || readOnly}
              onMouseDown={event => event.preventDefault()}
              onClick={() => insertOperator(operator.value)}
            >
              {operator.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
