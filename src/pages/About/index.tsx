import React from 'react'
import { Switch, Route } from 'react-router'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material'
import { Link } from 'react-router-dom'
import { Logo } from '@shared/ui/Logo'
import { ScrollToTop, TextLink } from './Components'
import Method from './pages/Method.mdx'
import About from './pages/About.mdx'
import QuickStart from './pages/QuickStart.mdx'
import './index.scss'

const components = { a: TextLink }

export default function Main() {
  return (
    <Box width="100%" sx={{ bgcolor: 'background.paper' }}>
      <ScrollToTop />
      <Header />

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        px={2}
        pt={8}
        pb={8}
      >
        <Box width="100%" maxWidth={680} minWidth={100} className="article">
          <Switch>
            <Route
              path="/about/method"
              render={() => <Method components={components} />}
            />
            <Route
              path="/about/quick-start"
              render={() => <QuickStart components={components} />}
            />
            <Route
              path="/about"
              render={() => <About components={components} />}
            />
          </Switch>
        </Box>
      </Box>
    </Box>
  )
}

const Header = () => {
  const theme = useTheme()
  return (
    <Box
      position="sticky"
      top={0}
      left={0}
      right={0}
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={1}
      zIndex={100}
    >
      <Link to="/">
        <Box
          sx={{
            py: 1,
            px: 3,
            bgcolor: 'background.default',
            borderRadius: 3,
            lineHeight: 0,
          }}
        >
          <Logo fill={theme.palette.primary.main} width="100" />
        </Box>
      </Link>
    </Box>
  )
}
