import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'
import { getContrastText } from './theme/color'
import { Checkbox, type CheckboxProps } from './Checkbox'

const isSvgUrl = (symbol: string): boolean => {
  return symbol.startsWith('data:image/svg') || symbol.includes('.svg')
}

export type TagIconProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'color' | 'onChange'
> & {
  symbol: string
  color?: string | null
  size?: 's' | 'm'
  onCheckedChange?: CheckboxProps['onCheckedChange']
  checked?: boolean
  showCheckBox?: boolean
  checkboxProps?: CheckboxProps
  button?: boolean
}

export function TagIcon(props: TagIconProps) {
  const {
    symbol,
    color,
    size = 's',
    onCheckedChange,
    checked,
    showCheckBox,
    checkboxProps,
    button = false,
    className,
    style,
    ...rest
  } = props
  const isInteractive = !!onCheckedChange
  const isSvg = isSvgUrl(symbol)
  const contentIsHidden = !!showCheckBox || !!checked
  const { className: checkboxClassName, ...restCheckboxProps } =
    checkboxProps ?? {}

  return (
    <div
      {...rest}
      className={cn(
        'group relative flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-in-out',
        size === 's' ? 'size-8' : 'size-10',
        color ? 'border' : 'border-0',
        // Without a tag colour the icon is the card it sits on: the contrast
        // calculation over `background.paper` lands on the card's own text
        // colour in either scheme, so it is a token rather than a computation.
        !color && 'bg-muted text-card-foreground',
        button
          ? 'cursor-pointer hover:scale-110 active:scale-100 active:duration-100'
          : 'cursor-auto',
        className
      )}
      style={{
        // A tag's colour is the user's, so this one has to be computed.
        ...(color && {
          color: getContrastText(color),
          borderColor: color,
          backgroundColor: color,
          backgroundImage:
            'linear-gradient(-30deg, rgba(255,255,255,0.2), transparent)',
        }),
        ...style,
      }}
    >
      {isSvg ? (
        <span
          className={cn(
            'shrink-0 bg-current transition-opacity duration-200',
            size === 's' ? 'size-5' : 'size-6',
            contentIsHidden ? 'opacity-0' : 'opacity-100',
            isInteractive ? 'group-hover:opacity-0' : 'group-hover:opacity-100'
          )}
          style={{
            maskImage: `url("${symbol}")`,
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            maskSize: 'contain',
            WebkitMaskImage: `url("${symbol}")`,
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
          }}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            'shrink-0 transition-opacity duration-200',
            size === 's' ? 'text-base' : 'text-2xl',
            contentIsHidden ? 'opacity-0' : 'opacity-100',
            isInteractive ? 'group-hover:opacity-0' : 'group-hover:opacity-100'
          )}
        >
          {symbol}
        </span>
      )}
      {onCheckedChange && (
        <Checkbox
          className={cn(
            'absolute transition-opacity duration-200',
            showCheckBox || checked ? 'opacity-100' : 'opacity-0',
            isInteractive ? 'group-hover:opacity-100' : 'group-hover:opacity-0',
            checkboxClassName
          )}
          checked={checked}
          onClick={e => e.stopPropagation()}
          onCheckedChange={onCheckedChange}
          {...restCheckboxProps}
        />
      )}
    </div>
  )
}
