import type { ComponentPropsWithoutRef } from 'react'
import { clsx } from 'clsx'
// `useTheme` is here for `getContrastText`, which is a colour calculation
// rather than a control; it converts with the theme.
import { useTheme } from '@mui/material'
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
  const theme = useTheme()
  const isInteractive = !!onCheckedChange
  const isSvg = isSvgUrl(symbol)
  const contentIsHidden = !!showCheckBox || !!checked
  const { className: checkboxClassName, ...restCheckboxProps } =
    checkboxProps ?? {}

  return (
    <div
      {...rest}
      className={clsx(
        'group relative flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-in-out',
        size === 's' ? 'size-8' : 'size-10',
        color ? 'border' : 'border-0',
        button
          ? 'cursor-pointer hover:scale-110 active:scale-100 active:duration-100'
          : 'cursor-auto',
        className
      )}
      style={{
        color: theme.palette.getContrastText(
          color || theme.palette.background.paper
        ),
        borderColor: color || undefined,
        backgroundColor: color || theme.palette.action.hover,
        backgroundImage: color
          ? 'linear-gradient(-30deg, rgba(255,255,255,0.2), transparent)'
          : undefined,
        ...style,
      }}
    >
      {isSvg ? (
        <span
          className={clsx(
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
          className={clsx(
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
          className={clsx(
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
