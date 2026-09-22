import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { Tooltip } from './Tooltip'
import { cn } from '@/6-shared/ui/shadcn/utils'

export const buttonPressAnimation = [
  'will-change-transform',
  'active:not-aria-[haspopup]:scale-x-97',
  'active:not-aria-[haspopup]:scale-y-104',
  'active:transition-all active:duration-50',
  '[transition:all_150ms_ease,scale_600ms_var(--ease-overshoot)]',
]

const buttonVariants = cva(
  [
    'group/button inline-flex shrink-0 items-center justify-center rounded-ui-control smooth border border-transparent bg-clip-padding text-ui-16 font-medium whitespace-nowrap select-none focusable',
    ...buttonPressAnimation,
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
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

const geometry = {
  regular: {
    lg: 'h-12 gap-1.5 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
    sm: 'h-10 gap-1.5 px-3 rounded-ui-control-inner has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
  },
  icon: {
    lg: 'size-12',
    sm: 'size-10 rounded-ui-control-inner',
  },
}

type ButtonVariants = {
  variant: NonNullable<VariantProps<typeof buttonVariants>['variant']>
  size: keyof typeof geometry.regular
}

export type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  Partial<ButtonVariants> & {
    className?: string
  }

export type IconButtonProps = Omit<ButtonProps, 'aria-label'> & {
  label: string
  tooltip?: boolean
}

/** Values for stories */
const buttonOptions: {
  [K in keyof ButtonVariants]: NonNullable<ButtonVariants[K]>[]
} = {
  variant: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
  size: ['lg', 'sm'],
}

function Button({ className, variant, size = 'lg', ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant }),
        geometry.regular[size],
        className
      )}
      {...props}
    />
  )
}

function IconButton({
  label,
  tooltip = true,
  className,
  variant,
  size = 'lg',
  ...props
}: IconButtonProps) {
  return (
    <Tooltip content={label} disabled={!tooltip}>
      <ButtonPrimitive
        data-slot="icon-button"
        className={cn(
          buttonVariants({ variant }),
          geometry.icon[size],
          className
        )}
        {...props}
        aria-label={label}
      />
    </Tooltip>
  )
}

export { Button, IconButton, buttonOptions }
