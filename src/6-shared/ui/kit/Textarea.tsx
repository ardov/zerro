import { useRef, useImperativeHandle, type ComponentPropsWithRef } from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Field, fieldControlClass, type FieldPresentation } from './Field'

export type TextareaProps = Omit<ComponentPropsWithRef<'textarea'>, 'rows'> &
  FieldPresentation & {
    /** Reports the text after the native onChange handler. */
    onValueChange?: (value: string) => void
    /** Minimum height in lines. Defaults to one. */
    minRows?: number
    /** Maximum height in lines; additional content scrolls. */
    maxRows?: number
  }

export function Textarea(props: TextareaProps) {
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
    minRows = 1,
    maxRows,
    onChange,
    onValueChange,
    ...restProps
  } = props
  const controlRef = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => controlRef.current!)
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
      }}
      fixedLabel
      addonAlign={labelMode === 'hidden' ? 'first-line' : 'stretch'}
    >
      <FieldPrimitive.Control
        // Base UI types Control as an input, but renders and dispatches events
        // from the textarea below. Keep the native textarea types for callers.
        {...(restProps as FieldPrimitive.Control.Props)}
        ref={controlRef}
        readOnly={readOnly}
        render={
          <textarea
            rows={minRows}
            onChange={event => {
              const value = event.currentTarget.value
              onChange?.(event)
              onValueChange?.(value)
            }}
          />
        }
        className={cn(
          fieldControlClass,
          'field-sizing-content resize-none overflow-y-auto',
          controlClassName
        )}
        style={{
          minHeight: `${minRows}lh`,
          maxHeight: maxRows === undefined ? undefined : `${maxRows}lh`,
          ...controlStyle,
        }}
      />
    </Field>
  )
}
