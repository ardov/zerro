import { cn } from '@/6-shared/ui/shadcn/utils'
import type { FC } from 'react'

import type { ComponentPropsWithoutRef } from 'react'
import { ListRowButton } from '@/6-shared/ui/kit/ListRow'
import { TextFade } from '@/6-shared/ui/kit/TextFade'
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
    <ListRowButton
      size="sm"
      className={className}
      {...rest}
      end={
        <Tooltip
          content={<Amount value={balance} currency={currency} noShade />}
          side="right"
        >
          <Amount
            className={cn(
              'block whitespace-nowrap',
              balance < 0 ? 'text-ui-error' : 'text-ui-secondary'
            )}
            value={balance}
            currency={currency}
            decimals="ifOnly"
            noShade
          />
        </Tooltip>
      }
    >
      <TextFade title={name}>{name}</TextFade>
    </ListRowButton>
  )
}
