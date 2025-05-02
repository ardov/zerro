import { FC } from 'react'
import { Box, BoxProps } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useTranslation } from 'react-i18next'

export interface PercentBarItem {
  id: string
  amount: number
  color: string
  name: string
}

export interface PercentBarProps extends BoxProps {
  data: PercentBarItem[]
  visibleData?: PercentBarItem[]
  height?: string
}

export const PercentBar: FC<PercentBarProps> = ({
  data,
  visibleData,
  height = '8px',
  ...rest
}) => {
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })

  const showAllData = !visibleData || visibleData.length === data.length
  const displayData = showAllData ? data : visibleData || []

  const totalSum = data.reduce((sum, n) => sum + Math.abs(n.amount), 0)
  const visibleSum = displayData.reduce((sum, n) => sum + Math.abs(n.amount), 0)
  const hiddenSum = totalSum - visibleSum
  const showAll = showAllData

  if (totalSum === 0) return null

  return (
    <Box
      display="flex"
      width="100%"
      height={height}
      borderRadius="6px"
      overflow="hidden"
      {...rest}
    >
      {displayData.map((bar, i) => (
        <Tooltip title={bar.name} key={bar.id}>
          <Box
            flexBasis={(Math.abs(bar.amount) * 100) / totalSum + '%'}
            minWidth={'2px'}
            pl={i === 0 ? 0 : '1px'}
          >
            <Box bgcolor={bar.color} height="100%" />
          </Box>
        </Tooltip>
      ))}

      {!showAll && hiddenSum > 0 && (
        <Tooltip title={t('otherCategories')}>
          <Box
            flexBasis={(hiddenSum * 100) / totalSum + '%'}
            minWidth={'2px'}
            pl={'1px'}
          >
            <Box bgcolor={'#333333'} height="100%" />
          </Box>
        </Tooltip>
      )}
    </Box>
  )
}
