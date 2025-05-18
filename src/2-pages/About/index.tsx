import type { MDXComponents } from 'mdx/types'

import React from 'react'
import { Switch, Route } from 'react-router'
import { Box } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAppTheme } from '6-shared/ui/theme'
import { Logo } from '6-shared/ui/Logo'
import { LangSwitcher } from '6-shared/localization'
import { ScrollToTop, TextLink } from './Components'
import MethodRu from './pages/MethodRu.mdx'
import MethodEn from './pages/MethodEn.mdx'
import AboutRu from './pages/AboutRu.mdx'
import AboutEn from './pages/AboutEn.mdx'
import QuickStartEn from './pages/QuickStartEn.mdx'
import QuickStartRu from './pages/QuickStarRu.mdx'
import './index.scss'

const components = { a: TextLink } as MDXComponents

const About = () => {
  return (
    <LangSwitcher
      ru={<AboutRu components={components} />}
      en={<AboutEn components={components} />}
    />
  )
}
const Method = () => {
  return (
    <LangSwitcher
      ru={<MethodRu components={components} />}
      en={<MethodEn components={components} />}
    />
  )
}
const QuickStart = () => {
  return (
    <LangSwitcher
      ru={<QuickStartRu components={components} />}
      en={<QuickStartEn components={components} />}
    />
  )
}

export default function Main() {
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <ScrollToTop />
      <Header />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          pt: 8,
          pb: 8,
        }}
      >
        <Box
          className="article"
          sx={{ width: '100%', maxWidth: 680, minWidth: 100 }}
        >
          <Switch>
            <Route path="/about/method" render={() => <Method />} />
            <Route path="/about/quick-start" render={() => <QuickStart />} />
            <Route path="/about" render={() => <About />} />
          </Switch>
        </Box>
      </Box>
    </Box>
  )
}

const Header = () => {
  const theme = useAppTheme()
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
        zIndex: 100,
      }}
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
