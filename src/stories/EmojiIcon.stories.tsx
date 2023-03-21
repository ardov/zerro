import React from 'react'
import { EmojiIcon } from '@shared/ui/EmojiIcon'
import { Meta, StoryObj } from '@storybook/react'
import { context } from './shared/context'

const meta = {
  title: 'EmojiIcon',
  component: EmojiIcon,
  decorators: [context],
  argTypes: {
    color: { control: { type: 'color' } },
  },
} satisfies Meta<typeof EmojiIcon>

export default meta

type Story = StoryObj<typeof meta>

export const Icon: Story = {
  args: { symbol: '💩' },
}
