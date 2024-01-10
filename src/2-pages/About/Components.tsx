import React, { FC, ReactNode, useEffect } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Box, BoxProps, ButtonBase } from '@mui/material'
import { ChevronRightIcon } from '6-shared/ui/Icons'
import { useToggle } from '6-shared/hooks/useToggle'

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

type DetailsBoxProps = BoxProps & { title: string }
export const DetailsBox: FC<DetailsBoxProps> = props => {
  const { children, title, ...rest } = props
  const [isOpen, toggle] = useToggle(false)
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        my: 2,
        p: 3,
        borderRadius: 1,
      }}
      {...rest}
    >
      <ButtonBase
        disableRipple
        onClick={toggle}
        sx={{
          font: 'inferit',
          fontSize: 'inherit',
          p: 2,
          m: -2,
          borderRadius: 1,
          textAlign: 'left',
          width: '100%',
          justifyContent: 'flex-start',
          ':hover': { textDecoration: 'underline' },
        }}
      >
        <ChevronRightIcon
          sx={{
            mr: 1,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: '200ms ease-in-out',
            color: 'secondary.main',
          }}
        />
        <strong>{title}</strong>
      </ButtonBase>

      {isOpen && (
        <Box component="aside" className="slide-down" mt={2} pl={4}>
          {children}
        </Box>
      )}
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

type TextLinkProps = { href?: string; children?: ReactNode }
export const TextLink: FC<TextLinkProps> = ({ href, ...rest }) => {
  if (href?.startsWith('/')) {
    return <RouterLink to={href} {...rest} />
  }
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
}
