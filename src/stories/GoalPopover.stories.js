import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { GoalPopover } from 'scenes/Budgets/containers/TagTable/GoalPopover'
import decorator from 'helpers/storybookDecorator'

const data = {
  type: 'monthly',
  amount: 80000,
  date: +new Date(2020, 3),
  currency: 'USD',

  open: true,
}

export const actions = {
  onChange: action('onChange'),
}

storiesOf('GoalPopover', module)
  .addDecorator(decorator())
  .add('default', () => (
    <GoalPopover
      anchorReference="anchorPosition"
      anchorPosition={{ top: 40, left: 40 }}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      {...data}
      {...actions}
    />
  ))
