import {
  useRef,
  useState,
  useId,
  useImperativeHandle,
  type ComponentPropsWithRef,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { InputWidth } from './InputWidth'
import { Field, fieldControlClass, type FieldPresentation } from './Field'

export type InputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'prefix'
> &
  FieldPresentation & {
    /** Non-editable text in the value row; unlike start/end, it sits below the label. */
    prefix?: string
    suffix?: string
    /** Reports the text after the native onChange handler. */
    onValueChange?: (value: string) => void
  }

export function Input(props: InputProps) {
  const {
    label,
    labelMode = 'hidden',
    size,
    start,
    end,
    prefix,
    suffix,
    error,
    description,
    invalid,
    className,
    style,
    controlClassName,
    controlStyle,
    ref,
    disabled,
    readOnly,
    placeholder,
    onChange,
    onValueChange,
    defaultValue,
    ...restProps
  } = props
  const [draft, setDraft] = useState(defaultValue ?? '')
  const affixId = useId()
  const hasAffixes = Boolean(prefix || suffix)
  const displayValue = restProps.value ?? draft
  const controlRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => controlRef.current!)
  const fixedLabel = [
    'date',
    'time',
    'datetime-local',
    'month',
    'week',
  ].includes(restProps.type ?? '')
  return (
    <Field
      {...{
        label,
        labelMode,
        size,
        start,
        end,
        error,
        description,
        invalid,
        className,
        style,
        controlRef,
        disabled,
        readOnly,
        fixedLabel: fixedLabel || Boolean(placeholder) || hasAffixes,
      }}
    >
      {hasAffixes ? (
        <div className="flex w-full min-w-0 items-baseline gap-1">
          {prefix && (
            <span
              id={`${affixId}-prefix`}
              className="shrink-0 text-ui-secondary"
            >
              {prefix}
            </span>
          )}
          {suffix ? (
            <InputWidth
              value={String(displayValue)}
              placeholder={placeholder}
              className="text-ui-16"
            >
              {renderControl()}
            </InputWidth>
          ) : (
            <span className="min-w-0 flex-1">{renderControl()}</span>
          )}
          {suffix && (
            <span
              id={`${affixId}-suffix`}
              className="shrink-0 text-ui-secondary"
            >
              {suffix}
            </span>
          )}
        </div>
      ) : (
        renderControl()
      )}
    </Field>
  )

  function renderControl() {
    return (
      <InputPrimitive
        {...restProps}
        defaultValue={defaultValue}
        aria-describedby={
          [
            restProps['aria-describedby'],
            prefix && `${affixId}-prefix`,
            suffix && `${affixId}-suffix`,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        onChange={event => {
          const value = event.currentTarget.value
          if (suffix && restProps.value === undefined) setDraft(value)
          onChange?.(event)
          onValueChange?.(value)
        }}
        ref={controlRef}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(fieldControlClass, controlClassName)}
        style={controlStyle}
      />
    )
  }
}
