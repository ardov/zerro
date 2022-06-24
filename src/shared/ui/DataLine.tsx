import React, { FC } from 'react'
import { Box, BoxProps, TooltipProps, Typography } from '@mui/material'
import { Amount, AmountProps } from 'components/Amount'
import { Tooltip } from 'shared/ui/Tooltip'

type DataLineProps = BoxProps & {
  name: string
  amount?: AmountProps['value']
  currency?: AmountProps['currency']
  instrument?: AmountProps['instrument']
  color?: string
  colorOpacity?: number
  tooltip?: TooltipProps['title']
}

export const DataLine: FC<DataLineProps> = ({
  name,
  amount,
  currency,
  instrument,
  color,
  colorOpacity = 1,
  tooltip,
  ...rest
}) => {
  return (
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow={1} mr={1} minWidth={0} display="flex" alignItems="center">
        {!!color && <Dot color={color} colorOpacity={colorOpacity} />}
        {tooltip ? (
          <Tooltip title={tooltip}>
            <Typography noWrap variant="body1">
              {name}
            </Typography>
          </Tooltip>
        ) : (
          <Typography noWrap variant="body1">
            {name}
          </Typography>
        )}
      </Box>
      {amount !== undefined && (
        <Typography variant="body1">
          <Amount value={amount} currency={currency} instrument={instrument} />
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
    }}
  />
)
