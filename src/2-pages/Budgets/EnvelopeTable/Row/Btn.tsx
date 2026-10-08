import { cn } from '@/6-shared/ui/shadcn/utils'
import type { ButtonBaseProps } from '@/6-shared/ui/kit/ButtonBase'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import type { FC } from 'react'

// `font-sans` is not decorative: a native button resets the family to the user
// agent default, and the `typography: 'body1'` this replaces set it.
const style =
  '-mx-3 -my-2 min-w-0 rounded-lg px-3 py-2 text-right font-sans text-body transition-all duration-100 hover:bg-ui-highlight focusable active:bg-ui-pressed'

export const Btn: FC<ButtonBaseProps> = ({ className, ...props }) => (
  <ButtonBase className={cn(style, className)} {...props} />
)
