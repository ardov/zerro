import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import EmojiIcon from 'components/EmojiIcon'
import decorator from 'helpers/storybookDecorator'

const symbol = 'Hj'

export const actions = {
  onClick: action('onClick'),
}

storiesOf('EmojiIcon', module)
  .addDecorator(decorator())
  .add('default', () => <EmojiIcon symbol={symbol} {...actions} />)
  .add('m', () => <EmojiIcon symbol={symbol} {...actions} size="m" />)
