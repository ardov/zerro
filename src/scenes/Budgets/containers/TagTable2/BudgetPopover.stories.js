import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { storiesOf, addDecorator } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import BudgetPopover from './BudgetPopover'
import createTheme from 'helpers/createTheme'

const data = {
  amount: 100,
  prevAmount: 0,
}

export const actions = {
  onChange: action('onChange'),
  onClose: action('onClose'),
}

addDecorator(story => (
  <ThemeProvider theme={createTheme()}>
    <div style={{ padding: '3rem' }}>{story()}</div>
  </ThemeProvider>
))

storiesOf('BudgetPopover', module)
  // .addDecorator()
  .add('default', () => (
    <BudgetPopover
      anchorReference="anchorPosition"
      anchorPosition={{ top: 40, left: 40 }}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={true}
      {...data}
      {...actions}
    />
  ))
