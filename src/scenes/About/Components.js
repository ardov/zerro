import React from 'react'
import { Box, useTheme } from '@material-ui/core'
import { useEffect } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function ExampleBox({ children, symbol, ...rest }) {
  const theme = useTheme()
  return (
    <Box
      my={2}
      p={3}
      bgcolor="background.default"
      borderRadius={theme.shape.borderRadius}
      display="flex"
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

export function Muted({ children, ...rest }) {
  return (
    <Box color="text.secondary" component="span" {...rest}>
      {children}
    </Box>
  )
}

export function Link({ to, children, ...rest }) {
  if (!to) return <>{children}</>
  if (to?.startsWith('/')) {
    return (
      <RouterLink to={to} {...rest}>
        {children}
      </RouterLink>
    )
  }
  return (
    <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  )
}
