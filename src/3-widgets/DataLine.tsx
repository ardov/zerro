import type { FC, HTMLAttributes, ReactNode } from 'react'
import React from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import type { AmountProps } from '6-shared/ui/Amount'
import type { TooltipProps } from '6-shared/ui/Tooltip'
import { Tooltip } from '6-shared/ui/Tooltip'
// TODO: use Amount instead
import type { TSmartAmountProps } from '3-widgets/Amount'
import { SmartAmount } from '3-widgets/Amount'

type DataLineProps = HTMLAttributes<HTMLDivElement> & {
  name: ReactNode
  amount?: AmountProps['value']
  currency?: AmountProps['currency']
  instrument?: TSmartAmountProps['instrument']
  sign?: AmountProps['sign']
  color?: string
  colorOpacity?: number
  tooltip?: TooltipProps['title']
  variant?: 'body1' | 'body2' | 'caption' | 'h6'
}

export const DataLine: FC<DataLineProps> = ({
  name,
  amount,
  currency,
  instrument,
  sign,
  color,
  colorOpacity = 1,
  tooltip,
  variant = 'body1',
  className,
  ...rest
}) => {
  const typographyClassName =
    variant === 'body2'
      ? 'type-body-sm'
      : variant === 'caption'
        ? 'type-caption'
        : variant === 'h6'
          ? 'type-title'
          : 'type-body'

  return (
    <div className={cn('flex flex-row', className)} {...rest}>
      <div className="mr-2 flex min-w-0 grow items-center">
        {!!color && <Dot color={color} colorOpacity={colorOpacity} />}
        <Tooltip title={tooltip}>
          <span className={cn('truncate', typographyClassName)}>{name}</span>
        </Tooltip>
      </div>
      {amount !== undefined && (
        <span className={typographyClassName}>
          <SmartAmount
            value={amount}
            currency={currency}
            instrument={instrument}
            sign={sign}
          />
        </span>
      )}
    </div>
  )
}

type DotProps = { color: string; colorOpacity?: number }

const Dot: FC<DotProps> = ({ color, colorOpacity = 1 }) => (
  <span
    style={{
      width: 8,
      height: 8,
      background: color,
      display: 'inline-block',
      marginRight: 8,
      borderRadius: '50%',
      opacity: colorOpacity,
      flex: '0 0 auto',
    }}
  />
)

export const OneLiner: FC<{
  left: React.ReactNode
  right: React.ReactNode
}> = ({ left, right }) => {
  return (
    <div className="flex w-full text-base">
      <div className="relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]">
        {left}
      </div>

      <span className="ml-2 shrink-0">{right}</span>
    </div>
  )
}
