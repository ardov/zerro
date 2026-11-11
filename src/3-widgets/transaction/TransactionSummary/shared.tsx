import type { ButtonBaseProps } from '@/6-shared/ui/kit/ButtonBase'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { cn } from '@/6-shared/ui/shadcn/utils'

/** A word inside a sentence that changes what the sentence says. */
export function InlineButton({ className, ...props }: ButtonBaseProps) {
  return (
    <ButtonBase
      className={cn(
        '-mx-2 inline cursor-pointer rounded-lg px-2 align-baseline text-[length:inherit] leading-[inherit] text-info',
        className
      )}
      {...props}
    />
  )
}

export function cycle<T>(list: readonly T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length]
}
