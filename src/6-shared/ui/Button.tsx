import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from './shadcn/utils'

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> & {
  className?: string
}

export function Button({ className, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        'inline-flex min-w-16 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent px-2 py-1.5 font-sans text-sm leading-[1.75] font-medium text-primary hover:bg-primary-hover focus-visible:bg-primary-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-disabled-foreground',
        className
      )}
      {...props}
    />
  )
}

type IconButtonProps = ButtonProps & {
  /** Pulls the button back over the padding of the field it sits in, the way
   * MUI's `edge` does, so the icon lines up with the field's edge. */
  edge?: 'start' | 'end'
}

export function IconButton({ className, edge, ...props }: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-2 text-action-active hover:bg-accent focus-visible:bg-action-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-disabled-foreground',
        edge === 'start' && '-ml-3',
        edge === 'end' && '-mr-3',
        className
      )}
      {...props}
    />
  )
}
