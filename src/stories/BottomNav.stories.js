import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import BottomNav from 'components/BottomNavigation'
import decorator from 'helpers/storybookDecorator'
import { Router } from 'react-router-dom'
import { Box } from '@material-ui/core'

export const actions = {
  onClose: action('onClose'),
  onChange: action('onChange'),
  onDelete: action('onDelete'),
  onRestore: action('onRestore'),
  onSelectSimilar: action('onSelectSimilar'),
}

storiesOf('Navigation', module)
  .addDecorator(decorator({ width: 400, m: 0 }))
  .add('bottomNav', () => (
    // <Router>
    <Box
      // bgcolor="#222"
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
    >
      <Box flexGrow="1" bgcolor="#f22"></Box>
      <BottomNav {...actions} open={true} />
    </Box>
    // </Router>
  ))
