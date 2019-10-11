import React from 'react'
import { ThemeProvider } from '@material-ui/styles'
import { storiesOf, addDecorator } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import BudgetPopover from './BudgetPopover'
import createTheme from 'helpers/createTheme'

const data = {
  budgeted: 100,
  available: 0,
  prevBudgeted: 10,
  prevSpend: 3000,
  currency: 'USD',
  open: true,
}

export const actions = {
  onChange: action('onChange'),
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
      {...data}
      {...actions}
    />
  ))
