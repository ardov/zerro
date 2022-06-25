import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import BudgetPopover from 'pages/Budgets/components/BudgetPopover'
import decorator from 'shared/helpers/storybookDecorator'

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

storiesOf('BudgetPopover', module)
  .addDecorator(decorator())
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
