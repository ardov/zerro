import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import decorator from 'helpers/storybookDecorator'
import AmountInput from 'components/AmountInput'

const data = { value: 12004.23, currency: 'RUB', label: 'Доход' }

export const actions = {
  onChange: action('onChange'),
}

storiesOf('Amount Input', module)
  .addDecorator(decorator({ width: 360 - 32 }))
  .add('Default', () => <AmountInput {...data} {...actions} />)
