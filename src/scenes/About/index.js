import React from 'react'
import { Box } from '@material-ui/core'
import { useTheme } from '@material-ui/styles'
import { Link } from 'react-router-dom'
import './index.scss'
import Logo from 'components/Logo'
import { Switch, Route } from 'react-router'
import { ScrollToTop } from './Components'

/* eslint-disable import/no-webpack-loader-syntax */
import Method from '!babel-loader!@mdx-js/loader!./pages/Method.mdx'
import About from '!babel-loader!@mdx-js/loader!./pages/About.mdx'
import QuickStart from '!babel-loader!@mdx-js/loader!./pages/QuickStart.mdx'

export default function Main() {
  return (
    <Box width="100%" bgcolor="background.paper">
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
            <Route path="/about/method" component={Method} />
            <Route path="/about/quick-start" component={QuickStart} />
            <Route path="/about" component={About} />
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
          py={1}
          px={3}
          bgcolor="background.default"
          borderRadius={16}
          lineHeight={0}
        >
          <Logo fill={theme.palette.primary.main} width="100" />
        </Box>
      </Link>
    </Box>
  )
}
