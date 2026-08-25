import type { FC, ReactNode } from 'react'
import React from 'react'
import type { BoxProps, TooltipProps, TypographyProps } from '@mui/material'
import { Box, Typography } from '@mui/material'
import type { AmountProps } from '6-shared/ui/Amount'
import { Tooltip } from '6-shared/ui/Tooltip'
// TODO: use Amount instead
import type { TSmartAmountProps } from '3-widgets/Amount'
import { SmartAmount } from '3-widgets/Amount'

type DataLineProps = BoxProps & {
  name: ReactNode
  amount?: AmountProps['value']
  currency?: AmountProps['currency']
  instrument?: TSmartAmountProps['instrument']
  sign?: AmountProps['sign']
  color?: string
  colorOpacity?: number
  tooltip?: TooltipProps['title']
  variant?: TypographyProps['variant']
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
  ...rest
}) => {
  return (
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          flexDirection: 'row',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    >
      <div className="mr-2 flex min-w-0 grow items-center">
        {!!color && <Dot color={color} colorOpacity={colorOpacity} />}
        <Tooltip title={tooltip}>
          <Typography noWrap variant={variant}>
            {name}
          </Typography>
        </Tooltip>
      </div>
      {amount !== undefined && (
        <Typography variant={variant}>
          <SmartAmount
            value={amount}
            currency={currency}
            instrument={instrument}
            sign={sign}
          />
        </Typography>
      )}
    </Box>
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
