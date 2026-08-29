import type { HTMLAttributes } from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import type { TTransaction } from '6-shared/types'

export type TCardProps = {
  year: string | number
  onShowTransactions: (t: TTransaction[]) => void
}

export const Card = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      'flex min-h-[280px] max-w-[480px] flex-col items-center justify-center rounded-lg bg-card px-4 py-8',
      props.className
    )}
  />
)
