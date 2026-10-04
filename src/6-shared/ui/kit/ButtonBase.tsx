import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type ButtonBaseProps = Omit<ButtonPrimitive.Props, 'className'> & {
  className?: string
}

/** A reset native button for call sites that bring their own styling. */
export function ButtonBase(props: ButtonBaseProps) {
  const { className, ...restProps } = props
  return (
    <ButtonPrimitive
      data-slot="button-base"
      className={cn(
        'relative m-0 box-border inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 align-middle no-underline select-none focusable disabled:pointer-events-none disabled:cursor-default',
        className
      )}
      {...restProps}
    />
  )
}
