import React from 'react'
import { storiesOf, addDecorator } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import EmojiIcon from 'components/EmojiIcon'

const symbol = 'Hj'

export const actions = {
  onClick: action('onClick'),
}

addDecorator(story => <div style={{ padding: '3rem' }}>{story()}</div>)

storiesOf('EmojiIcon', module)
  // .addDecorator()
  .add('default', () => <EmojiIcon symbol={symbol} {...actions} />)
  .add('m', () => <EmojiIcon symbol={symbol} {...actions} size="m" />)
