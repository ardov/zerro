import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import ErrorMessage from 'components/ErrorBoundary/ErrorMessage'
import decorator from 'shared/helpers/storybookDecorator'

export const actions = {
  onLogOut: action('onLogOut'),
}

storiesOf('ErrorMessage', module)
  .addDecorator(decorator())
  .add('default', () => <ErrorMessage {...actions} />)
