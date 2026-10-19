import type { FC } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

import type { ComponentPropsWithoutRef } from 'react'
import { listItemDenseClass } from '@/6-shared/ui/ListRow'
import type { TFxCode } from '@/6-shared/types'
import { Amount } from '@/6-shared/ui/Amount'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'

export const Debtor: FC<
  { name: string; currency: TFxCode; balance: number } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'children'
  >
> = ({ name, currency, balance, className, ...rest }) => {
  return (
    <button
      type="button"
      className={cn(listItemDenseClass, className)}
      {...rest}
    >
      <div
        className="relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]"
        title={name}
      >
        {name}
      </div>

      <span
        className={cn(
          'ml-2 shrink-0',
          balance < 0 ? 'text-ui-error' : 'text-ui-secondary'
        )}
      >
        <Tooltip
          content={<Amount value={balance} currency={currency} noShade />}
          side="right"
        >
          <div>
            <Amount
              value={balance}
              currency={currency}
              decimals="ifOnly"
              noShade
            />
          </div>
        </Tooltip>
      </span>
    </button>
  )
}
