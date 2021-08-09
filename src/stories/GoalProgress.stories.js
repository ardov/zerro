import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { GoalProgress } from 'components/GoalProgress'
import decorator from 'helpers/storybookDecorator'

export const actions = {
  onClick: action('onClick'),
}

storiesOf('GoalProgress', module)
  .addDecorator(decorator())
  .add('default', () => (
    <div>
      <GoalProgress size={16} value={0.4} {...actions} />
      <GoalProgress size={16} value={1} {...actions} />
      <GoalProgress size={16} value={0} {...actions} />
    </div>
  ))
