import type { CSSProperties } from 'react'
import './coloredSurface.css'
import { getContrastText } from '@/6-shared/helpers/color'
import { cn } from './shadcn/utils'

type CategoryIconProps = {
  symbol: string
  color?: string | null
  size?: 's' | 'm'
}

/** A decorative category mark; selection and interaction belong to its owner. */
export function CategoryIcon(props: CategoryIconProps) {
  const { symbol, color, size = 's' } = props
  const foreground = color ? getContrastText(color) : undefined
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-ui-selected text-ui-primary',
        size === 's' ? 'size-8' : 'size-10',
        color && 'colored-surface'
      )}
      style={
        color
          ? ({
              backgroundColor: color,
              color: foreground,
              '--surface-color': color,
              '--surface-direction': foreground === '#ffffff' ? -1 : 1,
            } as CSSProperties)
          : undefined
      }
    >
      <CategorySymbol symbol={symbol} size={size} />
    </span>
  )
}

export function CategorySymbol(props: {
  symbol: string
  size?: 's' | 'm'
  className?: string
}) {
  const { symbol, size = 's', className } = props
  const svg = symbol.startsWith('data:image/svg') || symbol.includes('.svg')
  return svg ? (
    <span
      aria-hidden
      className={cn(
        'shrink-0 bg-current',
        size === 's' ? 'size-5' : 'size-6',
        className
      )}
      style={{
        maskImage: `url("${symbol}")`,
        maskPosition: 'center',
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
      }}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'shrink-0 leading-none',
        size === 's' ? 'text-base' : 'text-2xl',
        className
      )}
    >
      {symbol}
    </span>
  )
}
