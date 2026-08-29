import type { ComponentPropsWithoutRef, FC } from 'react'
import { cn } from '../shadcn/utils'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useTranslation } from 'react-i18next'

export interface PercentBarItem {
  id: string
  amount: number
  color: string
  name: string
}

export interface PercentBarProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> {
  data: PercentBarItem[]
  visibleData?: PercentBarItem[]
  height?: string
}

export const PercentBar: FC<PercentBarProps> = ({
  data,
  visibleData,
  height = '8px',
  className,
  style,
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
    <div
      {...rest}
      className={cn('flex w-full overflow-hidden rounded-[6px]', className)}
      style={{ height, ...style }}
    >
      {displayData.map((bar, i) => (
        <Tooltip title={bar.name} key={bar.id}>
          <div
            className="min-w-[2px]"
            style={{
              flexBasis: `${(Math.abs(bar.amount) * 100) / totalSum}%`,
              paddingLeft: i === 0 ? 0 : 1,
            }}
          >
            <div className="h-full" style={{ backgroundColor: bar.color }} />
          </div>
        </Tooltip>
      ))}
      {!showAll && hiddenSum > 0 && (
        <Tooltip title={t('otherCategories')}>
          <div
            className="min-w-[2px] pl-px"
            style={{
              flexBasis: `${(hiddenSum * 100) / totalSum}%`,
            }}
          >
            <div className="h-full bg-[#333333]" />
          </div>
        </Tooltip>
      )}
    </div>
  )
}
