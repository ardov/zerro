import React from 'react'
import { EmojiIcon, EmojiIconProps } from 'shared/ui/EmojiIcon'
import { Story, Meta } from '@storybook/react'

export default {
  title: 'EmojiIcon',
  component: EmojiIcon,
  argTypes: { color: { control: { type: 'color' } } },
} as Meta

const Template: Story<EmojiIconProps> = args => <EmojiIcon {...args} />
export const Icon = Template.bind({})
Icon.args = { symbol: '💩' }
