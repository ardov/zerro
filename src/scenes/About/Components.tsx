import React, { FC, ReactNode } from 'react'
import { Box, BoxProps, ButtonBase, IconButton } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useEffect } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import { useToggle } from 'helpers/useToggle'

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
          ':hover': { textDecoration: 'underline' },
        }}
      >
        <ChevronRightIcon
          sx={{
            mr: 1,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: '200ms ease-in-out',
          }}
        />
        {title}
      </ButtonBase>

      {isOpen && (
        <Box className="slide-down" mt={2} pl={4}>
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

type TextLinkProps = { href: string; children: ReactNode }
export const TextLink: FC<TextLinkProps> = ({ href, ...rest }) => {
  if (href?.startsWith('/')) {
    return <RouterLink to={href} {...rest} />
  }
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
}
