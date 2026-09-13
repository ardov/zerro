import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/6-shared/ui/shadcn/utils'

const buttonVariants = cva(
  [
    'group/button inline-flex shrink-0 items-center justify-center rounded-ui-control smooth border border-transparent bg-transparent bg-clip-padding text-ui-16 font-medium whitespace-nowrap select-none focusable will-change-transform',
    'active:not-aria-[haspopup]:scale-x-97',
    'active:not-aria-[haspopup]:scale-y-104',
    'active:transition-all active:duration-50',
    '[transition:all_150ms_ease,scale_600ms_var(--ease-overshoot)]',
    'disabled:pointer-events-none disabled:opacity-ui-disabled',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-ui-button-primary bg-ui-button-primary text-ui-on-button-primary',
          'active:bg-ui-button-primary',
        ],
        secondary: [
          'bg-ui-highlight border-ui-highlight text-ui-secondary',
          'hover:bg-ui-pressed hover:border-ui-pressed hover:text-ui-primary',
          'aria-expanded:bg-ui-pressed aria-expanded:text-ui-primary',
          'active:bg-ui-pressed active:border-ui-pressed active:text-ui-primary',
        ],
        outline: [
          'border-ui-border text-ui-secondary',
          'hover:bg-ui-highlight hover:text-ui-primary',
          'aria-expanded:bg-ui-highlight aria-expanded:text-ui-primary',
        ],
        ghost: [
          'hover:bg-ui-highlight hover:text-ui-primary',
          'aria-expanded:bg-ui-highlight aria-expanded:text-ui-primary',
        ],
        destructive: [
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        ],
      },
      size: {
        lg: [
          'h-12 gap-1.5 px-6',
          'has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        ],
        sm: [
          'h-10 gap-1.5 px-3 rounded-ui-control-inner',
          'has-data-[icon=inline-end]:pr-2',
          'has-data-[icon=inline-start]:pl-2',
        ],

        'icon-lg': ['size-12'],
        'icon-sm': ['size-10 rounded-ui-control-inner'],
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  }
)

type ButtonVariants = Required<VariantProps<typeof buttonVariants>>

/** Values for stories */
const buttonOptions: {
  [K in keyof ButtonVariants]: NonNullable<ButtonVariants[K]>[]
} = {
  variant: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
  size: ['lg', 'sm', 'icon-sm', 'icon-lg'],
}

function Button({
  className,
  variant = 'primary',
  size = 'lg',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonOptions }
