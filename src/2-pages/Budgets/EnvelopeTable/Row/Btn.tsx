import { cn } from '@/6-shared/ui/shadcn/utils'
import type { ButtonBaseProps } from '@/6-shared/ui/kit/ButtonBase'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import type { FC } from 'react'

// Native buttons need font-sans to retain the table's font family.
const style =
  '-mx-3 -my-2 min-w-0 rounded-lg px-3 py-2 text-right font-sans text-body hover:bg-ui-highlight focusable active:bg-ui-pressed'

export const Btn: FC<ButtonBaseProps> = ({ className, ...props }) => (
  <ButtonBase className={cn(style, className)} {...props} />
)
