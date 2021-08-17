import React, { FC, ReactNode } from 'react'
import { Box, BoxProps } from '@material-ui/core'
import { useEffect } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

type ExampleBoxProps = BoxProps & { symbol: string }
export const ExampleBox: FC<ExampleBoxProps> = ({
  children,
  symbol,
  ...rest
}) => {
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        my: 2,
        p: 3,
        borderRadius: 1,
        display: 'flex',
      }}
      {...rest}
    >
      {symbol && (
        <Box mr={1} minWidth="24px">
          {symbol}
        </Box>
      )}
      <Box flexGrow={1}>{children}</Box>
    </Box>
  )
}

export const Muted: FC<BoxProps> = ({ children, ...rest }) => {
  return (
    <Box color="text.secondary" component="span" {...rest}>
      {children}
    </Box>
  )
}

type TextLinkProps = { href: string; children: ReactNode }
export const TextLink: FC<TextLinkProps> = ({ href, ...rest }) => {
  if (href?.startsWith('/')) {
    return <RouterLink to={href} {...rest} />
  }
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
}
