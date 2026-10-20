import './coloredSurface.css'
import { CategorySymbol } from './CategoryIcon'
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactElement,
} from 'react'
import { cn } from './shadcn/utils'
import { getContrastText } from '@/6-shared/helpers/color'
import { Checkbox, type CheckboxProps } from './kit/Checkbox'

export type TagIconProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'color' | 'onChange'
> & {
  symbol: string | ReactElement
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
  const contentIsHidden = !!showCheckBox || !!checked
  const { className: checkboxClassName, ...restCheckboxProps } =
    checkboxProps ?? {}

  const foreground = color ? getContrastText(color) : undefined

  return (
    <div
      {...rest}
      data-surface-interactive={
        color && (button || (isInteractive && !checkboxProps?.disabled))
          ? true
          : undefined
      }
      className={cn(
        'tag-icon group relative flex shrink-0 items-center justify-center rounded-full',
        size === 's' ? 'size-8' : 'size-10',
        color ? 'colored-surface' : '',
        // Icons without a custom colour use the theme surface and foreground.
        !color && 'bg-ui-highlight text-ui-primary',
        button
          ? 'cursor-pointer hover:scale-110 active:scale-100'
          : 'cursor-auto',
        className
      )}
      style={
        {
          // A tag's colour is the user's, so this one has to be computed.
          ...(color && {
            color: foreground,
            '--surface-color': color,
            '--surface-direction': foreground === '#ffffff' ? -1 : 1,
          }),
          ...style,
        } as CSSProperties
      }
    >
      <span
        aria-hidden
        className={cn(
          'flex items-center justify-center transition-opacity duration-200',
          contentIsHidden ? 'opacity-0' : 'opacity-100',
          isInteractive ? 'group-hover:opacity-0' : 'group-hover:opacity-100'
        )}
      >
        {typeof symbol === 'string' ? (
          <CategorySymbol symbol={symbol} size={size} />
        ) : (
          symbol
        )}
      </span>
      {onCheckedChange && (
        <Checkbox
          color="currentColor"
          className={cn(
            'absolute transition-opacity duration-200 focus-visible:opacity-100',
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
