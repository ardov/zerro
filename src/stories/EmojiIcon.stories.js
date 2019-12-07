import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import EmojiIcon from 'components/EmojiIcon'
import decorator from 'helpers/storybookDecorator'

const symbol = '💩'

export const actions = {
  onClick: action('onClick'),
}

storiesOf('EmojiIcon', module)
  .addDecorator(decorator())
  .add('default', () => <EmojiIcon symbol={symbol} {...actions} />)
  .add('interactive', () => (
    <EmojiIcon checked onChange={() => {}} symbol={symbol} {...actions} />
  ))
  .add('m', () => (
    <div>
      <EmojiIcon
        symbol={symbol}
        showCheckBox
        onChange={() => {}}
        {...actions}
        size="m"
      />
      <EmojiIcon symbol={symbol} {...actions} size="m" />
    </div>
  ))
