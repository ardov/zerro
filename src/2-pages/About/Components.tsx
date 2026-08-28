import { ButtonBase } from '6-shared/ui/Button'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRightIcon } from '6-shared/ui/Icons'
import { useToggle } from '6-shared/hooks/useToggle'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

type ExampleBoxProps = HTMLAttributes<HTMLDivElement> & { symbol: string }
export const ExampleBox: FC<ExampleBoxProps> = ({
  children,
  symbol,
  className,
  ...rest
}) => {
  return (
    <div
      className={clsx('my-4 flex rounded-lg bg-background p-6', className)}
      {...rest}
    >
      {symbol && <span className="mr-2 min-w-6">{symbol}</span>}
      <div className="grow">{children}</div>
    </div>
  )
}

type DetailsBoxProps = HTMLAttributes<HTMLDivElement> & { title: string }
export const DetailsBox: FC<DetailsBoxProps> = props => {
  const { children, title, className, ...rest } = props
  const [isOpen, toggle] = useToggle(false)
  return (
    <div
      className={clsx('my-4 rounded-lg bg-background p-6', className)}
      {...rest}
    >
      <ButtonBase
        onClick={toggle}
        className="-m-4 w-full justify-start rounded-lg p-4 text-left text-[length:inherit] hover:underline"
      >
        <ChevronRightIcon
          className={clsx(
            'mr-2 text-interactive transition-transform duration-200 ease-in-out',
            isOpen && 'rotate-90'
          )}
        />
        <strong>{title}</strong>
      </ButtonBase>
      {isOpen && <aside className="slide-down mt-4 pl-8">{children}</aside>}
    </div>
  )
}

export const Muted: FC<HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <span className={clsx('text-muted-foreground', className)} {...rest}>
      {children}
    </span>
  )
}

type TextLinkProps = { href?: string; children?: ReactNode }
export const TextLink: FC<TextLinkProps> = ({ href, ...rest }) => {
  if (href?.startsWith('/')) {
    return <RouterLink to={href} {...rest} />
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
}
