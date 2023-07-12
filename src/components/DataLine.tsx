import React, { FC, ReactNode } from 'react'
import {
  Box,
  BoxProps,
  TooltipProps,
  Typography,
  TypographyProps,
} from '@mui/material'
import { AmountProps } from '@shared/ui/Amount'
import { Tooltip } from '@shared/ui/Tooltip'
// TODO: use Amount instead
import { SmartAmount, TSmartAmountProps } from '@components/Amount'

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
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow={1} mr={1} minWidth={0} display="flex" alignItems="center">
        {!!color && <Dot color={color} colorOpacity={colorOpacity} />}
        <Tooltip title={tooltip}>
          <Typography noWrap variant={variant}>
            {name}
          </Typography>
        </Tooltip>
      </Box>
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
    <Box sx={{ typography: 'body1', display: 'flex', width: '100%' }}>
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maskImage: 'linear-gradient(to left, transparent, black 40px)',
        }}
      >
        {left}
      </Box>

      <Box component="span" sx={{ ml: 1, flexShrink: 0 }}>
        {right}
      </Box>
    </Box>
  )
}
