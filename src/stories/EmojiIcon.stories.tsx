import React from 'react'
import { EmojiIcon, EmojiIconProps } from '@shared/ui/EmojiIcon'
import { Story, Meta } from '@storybook/react'
import { context } from './shared/context'

export default {
  title: 'EmojiIcon',
  component: EmojiIcon,
  decorators: [context],
  argTypes: { color: { control: { type: 'color' } } },
} as Meta

const Template: Story<EmojiIconProps> = args => <EmojiIcon {...args} />

export const Icon = Template.bind({})
Icon.args = { symbol: '💩' }
