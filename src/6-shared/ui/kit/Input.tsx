import { useRef, useImperativeHandle, type ComponentPropsWithRef } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Field, fieldControlClass, type FieldPresentation } from './Field'

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> &
  FieldPresentation

export function Input(props: InputProps) {
  const {
    label,
    labelMode = 'hidden',
    size,
    start,
    end,
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
    ...restProps
  } = props
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
        fixedLabel: fixedLabel || Boolean(placeholder),
      }}
    >
      <InputPrimitive
        {...restProps}
        ref={controlRef}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(fieldControlClass, controlClassName)}
        style={controlStyle}
      />
    </Field>
  )
}
